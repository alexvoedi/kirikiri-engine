import type { StorageProvider } from '../types/StorageProvider'
import { decodeTlg } from '../utils/decodeTlg'
import { encodePng } from '../utils/encodePng'
import { findFileInList } from './findFileInList'

const XP3_MAGIC = new Uint8Array([0x58, 0x50, 0x33, 0x0D, 0x0A, 0x20, 0x0A, 0x1A, 0x8B, 0x67, 0x01])
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
  archiveIndex: number
}

interface MountedArchive {
  name: string
  bytes: Uint8Array
}

export class Xp3StorageProvider implements StorageProvider {
  private readonly entries = new Map<string, Xp3Entry>()
  private readonly assetUrls = new Map<string, string>()
  private readonly entryPaths: string[] = []
  private initialized = false

  constructor(private readonly options: {
    root: string
    archives: string[]
  }) {}

  async readTextFile(filename: string, encoding = 'shift-jis'): Promise<string> {
    const bytes = await this.readBinaryFile(filename)
    return new TextDecoder(encoding).decode(bytes)
  }

  async readBinaryFile(filename: string): Promise<Uint8Array> {
    await this.ensureInitialized()

    const entry = this.getEntry(filename)

    if (entry.protected) {
      throw new Error(`Protected XP3 entry is not supported: ${entry.name}`)
    }

    const archive = this.mountedArchives[entry.archiveIndex]

    if (!archive) {
      throw new Error(`Archive backing ${entry.name} is missing`)
    }

    const buffers: Uint8Array[] = []
    let totalLength = 0

    for (const segment of entry.segments) {
      const segmentBytes = archive.bytes.subarray(
        segment.archiveOffset,
        segment.archiveOffset + segment.compressedSize,
      )

      const decoded = segment.compressed
        ? await inflate(segmentBytes)
        : segmentBytes

      if (decoded.length !== segment.originalSize) {
        throw new Error(`Segment size mismatch for ${entry.name}`)
      }

      buffers.push(decoded)
      totalLength += decoded.length
    }

    if (totalLength !== entry.originalSize) {
      throw new Error(`File size mismatch for ${entry.name}`)
    }

    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const buffer of buffers) {
      result.set(buffer, offset)
      offset += buffer.length
    }

    return result
  }

  async resolveAssetUrl(filename: string): Promise<string> {
    await this.ensureInitialized()

    const entryName = normalizePath(filename)
    const cached = this.assetUrls.get(entryName)

    if (cached) {
      return cached
    }

    if (isSolidColorAsset(entryName)) {
      const colorUrl = this.createSolidColorAssetUrl(entryName)
      this.assetUrls.set(entryName, colorUrl)
      return colorUrl
    }

    const entry = this.getEntry(filename)
    const bytes = await this.readBinaryFile(entry.name)

    let blob: Blob

    if (getExtension(entry.name) === '.tlg') {
      const image = decodeTlg(bytes)
      const pngBytes = encodePng(image.width, image.height, image.pixels)
      blob = new Blob([toArrayBuffer(pngBytes)], { type: 'image/png' })
    }
    else {
      const mimeType = getMimeType(entry.name)
      blob = new Blob([toArrayBuffer(bytes)], mimeType ? { type: mimeType } : undefined)
    }

    const url = URL.createObjectURL(blob)
    this.assetUrls.set(entryName, url)

    return url
  }

  private readonly mountedArchives: MountedArchive[] = []

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return
    }

    for (const archiveName of this.options.archives) {
      const bytes = await this.fetchArchive(archiveName)
      const archiveIndex = this.mountedArchives.push({
        name: archiveName,
        bytes,
      }) - 1

      const archiveEntries = await this.parseArchive(bytes, archiveIndex)

      for (const entry of archiveEntries) {
        const normalizedName = normalizePath(entry.name)
        this.entries.set(normalizedName, entry)
      }
    }

    this.entryPaths.length = 0
    this.entryPaths.push(...Array.from(this.entries.keys()).reverse())
    this.initialized = true
  }

  private async fetchArchive(archiveName: string): Promise<Uint8Array> {
    const url = new URL(archiveName, this.options.root.endsWith('/') ? this.options.root : `${this.options.root}/`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to load XP3 archive ${archiveName}: ${response.statusText}`)
    }

    return new Uint8Array(await response.arrayBuffer())
  }

  private getEntry(filename: string): Xp3Entry {
    const normalizedFile = normalizePath(filename)
    const exactMatch = this.entries.get(normalizedFile)

    if (exactMatch) {
      return exactMatch
    }

    const matchedPath = findFileInList(normalizedFile, this.entryPaths)

    if (!matchedPath) {
      throw new Error(`File ${filename} not found`)
    }

    const entry = this.entries.get(matchedPath)

    if (!entry) {
      throw new Error(`Indexed XP3 entry ${matchedPath} not found`)
    }

    return entry
  }

  private createSolidColorAssetUrl(filename: string): string {
    const rgb = filename.toLowerCase() === 'white'
      ? [255, 255, 255]
      : [0, 0, 0]

    const pixels = new Uint8Array(800 * 600 * 4)

    for (let offset = 0; offset < pixels.length; offset += 4) {
      pixels[offset] = rgb[0]
      pixels[offset + 1] = rgb[1]
      pixels[offset + 2] = rgb[2]
      pixels[offset + 3] = 255
    }

    const pngBytes = encodePng(800, 600, pixels)
    return URL.createObjectURL(new Blob([toArrayBuffer(pngBytes)], { type: 'image/png' }))
  }

  private async parseArchive(bytes: Uint8Array, archiveIndex: number): Promise<Xp3Entry[]> {
    if (!bytes.subarray(0, XP3_MAGIC.length).every((value, index) => value === XP3_MAGIC[index])) {
      throw new Error(`Archive ${this.options.archives[archiveIndex]} is not an XP3 file`)
    }

    let indexOffset = readUInt64LE(bytes, 11)
    const indexBuffers: Uint8Array[] = []

    while (true) {
      const flags = bytes[indexOffset]
      const compressedSize = readUInt64LE(bytes, indexOffset + 1)
      const originalSize = readUInt64LE(bytes, indexOffset + 9)
      const indexBytes = bytes.subarray(indexOffset + 17, indexOffset + 17 + compressedSize)
      const decoded = (flags & INDEX_FLAG_COMPRESSED) !== 0
        ? await inflate(indexBytes)
        : indexBytes

      if (decoded.length !== originalSize) {
        throw new Error(`Index size mismatch in ${this.options.archives[archiveIndex]}`)
      }

      indexBuffers.push(decoded)
      indexOffset += 17 + compressedSize

      if ((flags & INDEX_FLAG_CONTINUE) === 0) {
        break
      }
    }

    return indexBuffers.flatMap(indexBuffer => decodeIndex(indexBuffer, archiveIndex))
  }
}

function decodeIndex(indexBuffer: Uint8Array, archiveIndex: number): Xp3Entry[] {
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
      archiveIndex,
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

function readAscii(buffer: Uint8Array, offset: number, length: number): string {
  return new TextDecoder('ascii').decode(buffer.subarray(offset, offset + length))
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

function readUInt64LE(buffer: Uint8Array, offset: number): number {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const value = view.getBigUint64(offset, true)

  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`64-bit value at offset ${offset} exceeds JavaScript safe integer range`)
  }

  return Number(value)
}

function expectTag(buffer: Uint8Array, offset: number, expected: string): void {
  const actual = readAscii(buffer, offset, 4)

  if (actual !== expected) {
    throw new Error(`Expected tag ${expected} at offset ${offset}, found ${actual}`)
  }
}

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

function getMimeType(filename: string): string | undefined {
  const extension = getExtension(filename)

  switch (extension) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.ogg':
      return 'audio/ogg'
    case '.mp3':
      return 'audio/mpeg'
    case '.wav':
      return 'audio/wav'
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    default:
      return undefined
  }
}

function getExtension(filename: string): string {
  const index = filename.lastIndexOf('.')
  return index === -1 ? '' : filename.slice(index).toLowerCase()
}

function isSolidColorAsset(filename: string): boolean {
  const normalized = filename.toLowerCase()
  return normalized === 'black' || normalized === 'white'
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const body = new Response(toArrayBuffer(data)).body

  if (!body) {
    throw new Error('Unable to create stream for decompression')
  }

  const stream = body.pipeThrough(new DecompressionStream('deflate'))
  const arrayBuffer = await new Response(stream).arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(data.byteLength)
  copy.set(data)
  return copy.buffer
}
