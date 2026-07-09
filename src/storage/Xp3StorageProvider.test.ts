import { afterEach, describe, expect, it, vi } from 'vitest'
import { Xp3StorageProvider } from './Xp3StorageProvider'

const XP3_MAGIC = new Uint8Array([0x58, 0x50, 0x33, 0x0D, 0x0A, 0x20, 0x0A, 0x1A, 0x8B, 0x67, 0x01])
const ONE_BY_ONE_PNG = Uint8Array.from([
  0x89,
  0x50,
  0x4E,
  0x47,
  0x0D,
  0x0A,
  0x1A,
  0x0A,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x48,
  0x44,
  0x52,
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x01,
  0x08,
  0x06,
  0x00,
  0x00,
  0x00,
  0x1F,
  0x15,
  0xC4,
  0x89,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x44,
  0x41,
  0x54,
  0x78,
  0x9C,
  0x63,
  0xF8,
  0xCF,
  0xC0,
  0xF0,
  0x1F,
  0x00,
  0x05,
  0x00,
  0x01,
  0xFF,
  0x89,
  0x99,
  0x3D,
  0x1D,
  0x00,
  0x00,
  0x00,
  0x00,
  0x49,
  0x45,
  0x4E,
  0x44,
  0xAE,
  0x42,
  0x60,
  0x82,
])
const PROLOGUE_SCRIPT = [
  '*gameStart',
  '[bg storage="prologue1"]',
  'Hello from XP3',
].join('\n')

async function createArchiveFetchMock() {
  const archiveCache = new Map<string, Uint8Array>([
    ['scenario.xp3', createXp3Archive([
      {
        name: 'prologue.ks',
        bytes: new TextEncoder().encode(PROLOGUE_SCRIPT),
      },
    ])],
    ['bgimage.xp3', createXp3Archive([
      {
        name: 'prologue1.png',
        bytes: ONE_BY_ONE_PNG,
      },
    ])],
  ])

  return vi.fn(async (input: string | URL) => {
    const url = String(input)
    const archiveName = url.substring(url.lastIndexOf('/') + 1)
    const bytes = archiveCache.get(archiveName)

    if (!bytes) {
      return new Response(null, {
        status: 404,
        statusText: 'Not Found',
      })
    }

    const body = new Uint8Array(bytes.byteLength)
    body.set(bytes)
    return new Response(body.buffer)
  })
}

describe('xp3StorageProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads scripts and materializes asset urls from mounted archives', async () => {
    const fetchMock = await createArchiveFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    const provider = new Xp3StorageProvider({
      root: 'https://example.com/game',
      archives: ['scenario.xp3', 'bgimage.xp3'],
    })

    const script = await provider.readTextFile('prologue.ks', 'shift-jis')
    const imageUrl = await provider.resolveAssetUrl('prologue1')

    expect(script).toContain('*gameStart')
    expect(script).toContain('storage="prologue1"')
    expect(imageUrl.startsWith('blob:')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

function createXp3Archive(entries: Array<{
  name: string
  bytes: Uint8Array
}>): Uint8Array {
  const headerSize = XP3_MAGIC.length + 8
  let dataOffset = headerSize

  const archiveEntries = entries.map((entry) => {
    const archiveOffset = dataOffset
    dataOffset += entry.bytes.byteLength

    return {
      ...entry,
      archiveOffset,
    }
  })

  const indexBuffer = concatBytes(archiveEntries.map(createFileEntry))
  const indexHeader = new Uint8Array(17)

  writeUInt64LE(indexHeader, 1, indexBuffer.byteLength)
  writeUInt64LE(indexHeader, 9, indexBuffer.byteLength)

  const archive = new Uint8Array(dataOffset + indexHeader.byteLength + indexBuffer.byteLength)
  archive.set(XP3_MAGIC, 0)
  writeUInt64LE(archive, XP3_MAGIC.length, dataOffset)

  for (const entry of archiveEntries) {
    archive.set(entry.bytes, entry.archiveOffset)
  }

  archive.set(indexHeader, dataOffset)
  archive.set(indexBuffer, dataOffset + indexHeader.byteLength)

  return archive
}

function createFileEntry(entry: {
  name: string
  bytes: Uint8Array
  archiveOffset: number
}): Uint8Array {
  const infoChunk = createChunk('info', createInfoChunk(entry.name, entry.bytes.byteLength))
  const segmChunk = createChunk('segm', createSegmentChunk(entry.archiveOffset, entry.bytes.byteLength))
  const fileBody = concatBytes([infoChunk, segmChunk])
  const fileHeader = new Uint8Array(12)

  writeAscii(fileHeader, 0, 'File')
  writeUInt64LE(fileHeader, 4, fileBody.byteLength)

  return concatBytes([fileHeader, fileBody])
}

function createInfoChunk(name: string, byteLength: number): Uint8Array {
  const utf16Bytes = new Uint8Array(name.length * 2)

  for (let index = 0; index < name.length; index += 1) {
    const codePoint = name.charCodeAt(index)
    utf16Bytes[index * 2] = codePoint & 0xFF
    utf16Bytes[index * 2 + 1] = codePoint >>> 8
  }

  const body = new Uint8Array(22 + utf16Bytes.byteLength)

  writeUInt32LE(body, 0, 0)
  writeUInt64LE(body, 4, byteLength)
  writeUInt64LE(body, 12, byteLength)
  writeUInt16LE(body, 20, name.length)
  body.set(utf16Bytes, 22)

  return body
}

function createSegmentChunk(archiveOffset: number, byteLength: number): Uint8Array {
  const body = new Uint8Array(28)

  writeUInt32LE(body, 0, 0)
  writeUInt64LE(body, 4, archiveOffset)
  writeUInt64LE(body, 12, byteLength)
  writeUInt64LE(body, 20, byteLength)

  return body
}

function createChunk(tag: string, body: Uint8Array): Uint8Array {
  const header = new Uint8Array(12)

  writeAscii(header, 0, tag)
  writeUInt64LE(header, 4, body.byteLength)

  return concatBytes([header, body])
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const part of parts) {
    result.set(part, offset)
    offset += part.byteLength
  }

  return result
}

function writeAscii(target: Uint8Array, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    target[offset + index] = value.charCodeAt(index)
  }
}

function writeUInt16LE(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xFF
  target[offset + 1] = (value >>> 8) & 0xFF
}

function writeUInt32LE(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xFF
  target[offset + 1] = (value >>> 8) & 0xFF
  target[offset + 2] = (value >>> 16) & 0xFF
  target[offset + 3] = (value >>> 24) & 0xFF
}

function writeUInt64LE(target: Uint8Array, offset: number, value: number) {
  const bigValue = BigInt(value)

  for (let index = 0; index < 8; index += 1) {
    target[offset + index] = Number((bigValue >> BigInt(index * 8)) & 0xFFn)
  }
}
