#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import zlib from 'node:zlib'

const XP3_MAGIC = Buffer.from([0x58, 0x50, 0x33, 0x0D, 0x0A, 0x20, 0x0A, 0x1A, 0x8B, 0x67, 0x01])
const INDEX_FLAG_COMPRESSED = 0x01
const INDEX_FLAG_CONTINUE = 0x80
const SEGMENT_FLAG_COMPRESSED = 0x01
const FILE_FLAG_PROTECTED = 0x80000000

function printHelp() {
  console.log(`Usage: node scripts/xp3-unpack.mjs --input <archive.xp3> --output <directory>

Unpack a plain Kirikiri XP3 archive.

Options:
  -i, --input <archive.xp3>   Path to the XP3 archive
  -o, --output <directory>    Output directory
  -h, --help                  Print help`)
}

function parseArgs(argv) {
  const result = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '-h' || arg === '--help') {
      result.help = true
      continue
    }

    if (arg === '-i' || arg === '--input') {
      result.input = argv[index + 1]
      index += 1
      continue
    }

    if (arg === '-o' || arg === '--output') {
      result.output = argv[index + 1]
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return result
}

function readUInt64LE(buffer, offset) {
  const value = buffer.readBigUInt64LE(offset)

  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`64-bit value at offset ${offset} exceeds JavaScript safe integer range`)
  }

  return Number(value)
}

function expectTag(buffer, offset, tag) {
  const actual = buffer.subarray(offset, offset + 4).toString('ascii')

  if (actual !== tag) {
    throw new Error(`Expected tag ${tag} at offset ${offset}, found ${actual}`)
  }
}

function decodeIndex(indexBuffer) {
  const entries = []
  let offset = 0

  while (offset < indexBuffer.length) {
    expectTag(indexBuffer, offset, 'File')
    offset += 4

    const entrySize = readUInt64LE(indexBuffer, offset)
    offset += 8

    const entryEnd = offset + entrySize
    const entry = {
      name: '',
      originalSize: 0,
      compressedSize: 0,
      protected: false,
      segments: [],
      adler32: null,
    }

    while (offset < entryEnd) {
      const chunkTag = indexBuffer.subarray(offset, offset + 4).toString('ascii')
      offset += 4

      const chunkSize = readUInt64LE(indexBuffer, offset)
      offset += 8

      const chunkEnd = offset + chunkSize

      if (chunkTag === 'info') {
        const flags = indexBuffer.readUInt32LE(offset)
        const originalSize = readUInt64LE(indexBuffer, offset + 4)
        const compressedSize = readUInt64LE(indexBuffer, offset + 12)
        const nameLength = indexBuffer.readUInt16LE(offset + 20)
        const name = indexBuffer.subarray(offset + 22, offset + 22 + (nameLength * 2)).toString('utf16le')

        entry.name = name
        entry.originalSize = originalSize
        entry.compressedSize = compressedSize
        entry.protected = (flags & FILE_FLAG_PROTECTED) !== 0
      }
      else if (chunkTag === 'segm') {
        let segmentOffset = offset

        while (segmentOffset < chunkEnd) {
          const flags = indexBuffer.readUInt32LE(segmentOffset)
          const archiveOffset = readUInt64LE(indexBuffer, segmentOffset + 4)
          const originalSize = readUInt64LE(indexBuffer, segmentOffset + 12)
          const compressedSize = readUInt64LE(indexBuffer, segmentOffset + 20)

          entry.segments.push({
            compressed: (flags & SEGMENT_FLAG_COMPRESSED) !== 0,
            archiveOffset,
            originalSize,
            compressedSize,
          })

          segmentOffset += 28
        }
      }
      else if (chunkTag === 'adlr') {
        entry.adler32 = indexBuffer.readUInt32LE(offset)
      }

      offset = chunkEnd
    }

    entries.push(entry)
    offset = entryEnd
  }

  return entries
}

async function readIndexBuffers(handle) {
  const header = Buffer.alloc(19)
  await handle.read(header, 0, header.length, 0)

  if (!header.subarray(0, XP3_MAGIC.length).equals(XP3_MAGIC)) {
    throw new Error('Not an XP3 archive')
  }

  let position = readUInt64LE(header, 11)
  const buffers = []

  while (true) {
    const meta = Buffer.alloc(17)
    await handle.read(meta, 0, meta.length, position)

    const flags = meta[0]
    const compressedSize = readUInt64LE(meta, 1)
    const originalSize = readUInt64LE(meta, 9)
    const body = Buffer.alloc(compressedSize)
    await handle.read(body, 0, body.length, position + 17)

    const indexBuffer = (flags & INDEX_FLAG_COMPRESSED) !== 0
      ? zlib.inflateSync(body)
      : body

    if (indexBuffer.length !== originalSize) {
      throw new Error(`Index size mismatch at ${position}: expected ${originalSize}, got ${indexBuffer.length}`)
    }

    buffers.push(indexBuffer)
    position += 17 + compressedSize

    if ((flags & INDEX_FLAG_CONTINUE) === 0) {
      break
    }
  }

  return buffers
}

function sanitizeEntryPath(entryName) {
  const normalized = path.posix.normalize(entryName.replaceAll('\\', '/'))

  if (normalized.startsWith('../') || normalized === '..' || path.isAbsolute(normalized)) {
    throw new Error(`Refusing to write unsafe path: ${entryName}`)
  }

  return normalized
}

async function extractEntry(handle, outputDir, entry) {
  if (entry.protected) {
    throw new Error(`Unsupported protected entry: ${entry.name}`)
  }

  const buffers = []

  for (const segment of entry.segments) {
    const segmentBuffer = Buffer.alloc(segment.compressedSize)
    await handle.read(segmentBuffer, 0, segmentBuffer.length, segment.archiveOffset)

    const decoded = segment.compressed
      ? zlib.inflateSync(segmentBuffer)
      : segmentBuffer

    if (decoded.length !== segment.originalSize) {
      throw new Error(`Segment size mismatch for ${entry.name}`)
    }

    buffers.push(decoded)
  }

  const fileBuffer = Buffer.concat(buffers)

  if (fileBuffer.length !== entry.originalSize) {
    throw new Error(`File size mismatch for ${entry.name}`)
  }

  const relativePath = sanitizeEntryPath(entry.name)
  const outputPath = path.join(outputDir, relativePath)
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, fileBuffer)
}

async function unpackArchive(inputPath, outputDir) {
  const handle = await fs.open(inputPath, 'r')

  try {
    const indexBuffers = await readIndexBuffers(handle)
    const entries = indexBuffers.flatMap(decodeIndex)

    for (const entry of entries) {
      await extractEntry(handle, outputDir, entry)
    }

    return entries
  }
  finally {
    await handle.close()
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  if (!args.input || !args.output) {
    printHelp()
    process.exitCode = 1
    return
  }

  const entries = await unpackArchive(args.input, args.output)

  console.log(`Extracted ${entries.length} entries from ${args.input} to ${args.output}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
