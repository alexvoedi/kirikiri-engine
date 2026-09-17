import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import zlib from 'node:zlib'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

const VIDEO_ARCHIVE_PATH = path.resolve(process.cwd(), 'raw/video.xp3')
const VIDEO_CACHE_DIR = path.resolve(process.cwd(), 'dev/.xp3-video-cache')
const XP3_MAGIC = Buffer.from([0x58, 0x50, 0x33, 0x0D, 0x0A, 0x20, 0x0A, 0x1A, 0x8B, 0x67, 0x01])
const INDEX_FLAG_COMPRESSED = 0x01
const INDEX_FLAG_CONTINUE = 0x80
const SEGMENT_FLAG_COMPRESSED = 0x01
const FILE_FLAG_PROTECTED = 0x80000000

interface SegmentDescriptor {
  compressed: boolean
  archiveOffset: number
  originalSize: number
  compressedSize: number
}

interface Xp3Entry {
  name: string
  originalSize: number
  protected: boolean
  segments: SegmentDescriptor[]
}

interface Xp3ArchiveIndex {
  bytes: Buffer
  entries: Map<string, Xp3Entry>
}

let cachedVideoArchive: Xp3ArchiveIndex | undefined

function normalizePath(value: string): string {
  const normalized = value.replaceAll('\\', '/').split('/').filter(Boolean)
  const segments: string[] = []

  for (const segment of normalized) {
    if (segment === '.') {
      continue
    }

    if (segment === '..') {
      segments.pop()
      continue
    }

    segments.push(segment)
  }

  return segments.join('/')
}

function readUInt64LE(buffer: Uint8Array, offset: number): number {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const value = view.getBigUint64(offset, true)

  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`64-bit value at offset ${offset} exceeds JavaScript safe integer range`)
  }

  return Number(value)
}

function readUInt16LE(buffer: Uint8Array, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8)
}

function readUInt32LE(buffer: Uint8Array, offset: number): number {
  return (
    buffer[offset]
    | (buffer[offset + 1] << 8)
    | (buffer[offset + 2] << 16)
    | (buffer[offset + 3] << 24)
  ) >>> 0
}

function readAscii(buffer: Uint8Array, offset: number, length: number): string {
  return new TextDecoder('ascii').decode(buffer.subarray(offset, offset + length))
}

function expectTag(buffer: Uint8Array, offset: number, expected: string): void {
  const actual = readAscii(buffer, offset, 4)

  if (actual !== expected) {
    throw new Error(`Expected tag ${expected} at offset ${offset}, found ${actual}`)
  }
}

function decodeIndex(indexBuffer: Uint8Array): Xp3Entry[] {
  const entries: Xp3Entry[] = []
  let offset = 0

  while (offset < indexBuffer.length) {
    expectTag(indexBuffer, offset, 'File')
    offset += 4

    const entrySize = readUInt64LE(indexBuffer, offset)
    offset += 8

    const entryEnd = offset + entrySize
    const entry: Xp3Entry = {
      name: '',
      originalSize: 0,
      protected: false,
      segments: [],
    }

    while (offset < entryEnd) {
      const tag = readAscii(indexBuffer, offset, 4)
      offset += 4

      const chunkSize = readUInt64LE(indexBuffer, offset)
      offset += 8

      const chunkEnd = offset + chunkSize

      if (tag === 'info') {
        const flags = readUInt32LE(indexBuffer, offset)
        const originalSize = readUInt64LE(indexBuffer, offset + 4)
        const nameLength = readUInt16LE(indexBuffer, offset + 20)
        const name = new TextDecoder('utf-16le').decode(indexBuffer.subarray(offset + 22, offset + 22 + (nameLength * 2)))

        entry.name = name
        entry.originalSize = originalSize
        entry.protected = (flags & FILE_FLAG_PROTECTED) !== 0
      }
      else if (tag === 'segm') {
        let segmentOffset = offset

        while (segmentOffset < chunkEnd) {
          const flags = readUInt32LE(indexBuffer, segmentOffset)
          entry.segments.push({
            compressed: (flags & SEGMENT_FLAG_COMPRESSED) !== 0,
            archiveOffset: readUInt64LE(indexBuffer, segmentOffset + 4),
            originalSize: readUInt64LE(indexBuffer, segmentOffset + 12),
            compressedSize: readUInt64LE(indexBuffer, segmentOffset + 20),
          })

          segmentOffset += 28
        }
      }

      offset = chunkEnd
    }

    entries.push(entry)
    offset = entryEnd
  }

  return entries
}

function loadVideoArchive(): Xp3ArchiveIndex {
  if (cachedVideoArchive) {
    return cachedVideoArchive
  }

  const bytes = fs.readFileSync(VIDEO_ARCHIVE_PATH)

  if (!bytes.subarray(0, XP3_MAGIC.length).equals(XP3_MAGIC)) {
    throw new Error(`Archive ${VIDEO_ARCHIVE_PATH} is not an XP3 file`)
  }

  let indexOffset = readUInt64LE(bytes, 11)
  const indexBuffers: Uint8Array[] = []

  while (true) {
    const flags = bytes[indexOffset]
    const compressedSize = readUInt64LE(bytes, indexOffset + 1)
    const originalSize = readUInt64LE(bytes, indexOffset + 9)
    const indexBytes = bytes.subarray(indexOffset + 17, indexOffset + 17 + compressedSize)
    const decoded = (flags & INDEX_FLAG_COMPRESSED) !== 0
      ? zlib.inflateSync(indexBytes)
      : indexBytes

    if (decoded.length !== originalSize) {
      throw new Error(`Index size mismatch in ${VIDEO_ARCHIVE_PATH}`)
    }

    indexBuffers.push(decoded)
    indexOffset += 17 + compressedSize

    if ((flags & INDEX_FLAG_CONTINUE) === 0) {
      break
    }
  }

  const entries = new Map<string, Xp3Entry>()

  for (const entry of indexBuffers.flatMap(buffer => decodeIndex(buffer))) {
    entries.set(normalizePath(entry.name), entry)
  }

  cachedVideoArchive = {
    bytes,
    entries,
  }

  return cachedVideoArchive
}

function extractVideoEntry(filename: string): Buffer {
  const normalizedName = normalizePath(filename)
  const archive = loadVideoArchive()
  const entry = archive.entries.get(normalizedName)

  if (!entry) {
    throw new Error(`Video entry ${filename} not found in video.xp3`)
  }

  if (entry.protected) {
    throw new Error(`Protected XP3 entry is not supported: ${entry.name}`)
  }

  const buffers: Buffer[] = []
  let totalLength = 0

  for (const segment of entry.segments) {
    const segmentBytes = archive.bytes.subarray(
      segment.archiveOffset,
      segment.archiveOffset + segment.compressedSize,
    )

    const decoded = segment.compressed
      ? zlib.inflateSync(segmentBytes)
      : Buffer.from(segmentBytes)

    if (decoded.length !== segment.originalSize) {
      throw new Error(`Segment size mismatch for ${entry.name}`)
    }

    buffers.push(decoded)
    totalLength += decoded.length
  }

  const result = Buffer.concat(buffers)

  if (result.length !== totalLength || result.length !== entry.originalSize) {
    throw new Error(`File size mismatch for ${entry.name}`)
  }

  return result
}

function ensureExtractedVideoFile(filename: string): string {
  const normalizedName = normalizePath(filename)
  const outputPath = path.join(VIDEO_CACHE_DIR, normalizedName)

  if (fs.existsSync(outputPath)) {
    return outputPath
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, extractVideoEntry(normalizedName))

  return outputPath
}

function getMimeType(filename: string): string {
  const extension = path.extname(filename).toLowerCase()

  switch (extension) {
    case '.mpg':
    case '.mpeg':
      return 'video/mpeg'
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    default:
      return 'application/octet-stream'
  }
}

function parseRangeHeader(range: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim())

  if (!match) {
    return undefined
  }

  const [, startRaw, endRaw] = match

  if (startRaw === '' && endRaw === '') {
    return undefined
  }

  if (startRaw === '') {
    const suffixLength = Number(endRaw)

    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return undefined
    }

    const start = Math.max(0, size - suffixLength)

    return {
      start,
      end: size - 1,
    }
  }

  const start = Number(startRaw)
  const requestedEnd = endRaw === '' ? size - 1 : Number(endRaw)

  if (!Number.isFinite(start) || !Number.isFinite(requestedEnd) || start < 0 || requestedEnd < start) {
    return undefined
  }

  if (start >= size) {
    return 'unsatisfiable'
  }

  return {
    start,
    end: Math.min(size - 1, requestedEnd),
  }
}

export default defineConfig({
  base: './',
  root: 'dev',
  publicDir: '../raw',
  plugins: [{
    name: 'xp3-video-server',
    configureServer(server) {
      server.middlewares.use('/__xp3_video__', (req, res, next) => {
        try {
          const requestPath = req.url?.split('?')[0] ?? '/'
          const filename = decodeURIComponent(requestPath.replace(/^\/+/, ''))

          if (!filename) {
            res.statusCode = 400
            res.end('Missing video filename')
            return
          }

          const filePath = ensureExtractedVideoFile(filename)
          const stats = fs.statSync(filePath)
          const mimeType = getMimeType(filename)
          const range = typeof req.headers.range === 'string'
            ? parseRangeHeader(req.headers.range, stats.size)
            : undefined

          res.setHeader('Content-Type', mimeType)
          res.setHeader('Accept-Ranges', 'bytes')
          res.setHeader('Cache-Control', 'no-store')
          res.setHeader('Last-Modified', stats.mtime.toUTCString())

          if (range === 'unsatisfiable') {
            res.statusCode = 416
            res.setHeader('Content-Range', `bytes */${stats.size}`)
            res.end()
            return
          }

          if (range) {
            const chunkLength = range.end - range.start + 1
            res.statusCode = 206
            res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${stats.size}`)
            res.setHeader('Content-Length', String(chunkLength))

            if (req.method === 'HEAD') {
              res.end()
              return
            }

            fs.createReadStream(filePath, {
              start: range.start,
              end: range.end,
            }).pipe(res)
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Length', String(stats.size))

          if (req.method === 'HEAD') {
            res.end()
            return
          }

          fs.createReadStream(filePath).pipe(res)
        }
        catch (error) {
          server.config.logger.error(error instanceof Error ? error.message : String(error))
          next(error)
        }
      })
    },
  }],
  server: {
    port: 1337,
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
      ],
    },
  },
})
