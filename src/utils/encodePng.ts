const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

let crcTable: Uint32Array | undefined

export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  if (rgba.length !== width * height * 4) {
    throw new Error(`RGBA buffer size mismatch: expected ${width * height * 4}, got ${rgba.length}`)
  }

  const scanlineLength = (width * 4) + 1
  const raw = new Uint8Array(scanlineLength * height)

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * scanlineLength
    const pixelOffset = y * width * 4
    raw[rowOffset] = 0
    raw.set(rgba.subarray(pixelOffset, pixelOffset + (width * 4)), rowOffset + 1)
  }

  const ihdr = new Uint8Array(13)
  writeUint32BE(ihdr, 0, width)
  writeUint32BE(ihdr, 4, height)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = zlibStore(raw)

  return concatUint8Arrays([
    PNG_SIGNATURE,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idat),
    createChunk('IEND', new Uint8Array(0)),
  ])
}

function zlibStore(data: Uint8Array): Uint8Array {
  const blocks: Uint8Array[] = [new Uint8Array([0x78, 0x01])]
  let offset = 0

  while (offset < data.length) {
    const remaining = data.length - offset
    const blockLength = Math.min(remaining, 0xFFFF)
    const isFinal = offset + blockLength >= data.length
    const block = new Uint8Array(5 + blockLength)

    block[0] = isFinal ? 0x01 : 0x00
    block[1] = blockLength & 0xFF
    block[2] = (blockLength >>> 8) & 0xFF

    const nlen = (~blockLength) & 0xFFFF
    block[3] = nlen & 0xFF
    block[4] = (nlen >>> 8) & 0xFF
    block.set(data.subarray(offset, offset + blockLength), 5)

    blocks.push(block)
    offset += blockLength
  }

  const adler = new Uint8Array(4)
  writeUint32BE(adler, 0, adler32(data))
  blocks.push(adler)

  return concatUint8Arrays(blocks)
}

function createChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length)
  writeUint32BE(chunk, 0, data.length)

  const typeBytes = new TextEncoder().encode(type)
  chunk.set(typeBytes, 4)
  chunk.set(data, 8)

  writeUint32BE(chunk, 8 + data.length, crc32(chunk.subarray(4, 8 + data.length)))

  return chunk
}

function adler32(data: Uint8Array): number {
  let a = 1
  let b = 0

  for (let index = 0; index < data.length; index += 1) {
    a = (a + data[index]) % 65521
    b = (b + a) % 65521
  }

  return ((b << 16) | a) >>> 0
}

function crc32(data: Uint8Array): number {
  crcTable ??= createCrcTable()

  let crc = 0xFFFFFFFF

  for (let index = 0; index < data.length; index += 1) {
    crc = crcTable[(crc ^ data[index]) & 0xFF] ^ (crc >>> 8)
  }

  return (crc ^ 0xFFFFFFFF) >>> 0
}

function createCrcTable(): Uint32Array {
  const table = new Uint32Array(256)

  for (let index = 0; index < 256; index += 1) {
    let c = index

    for (let bit = 0; bit < 8; bit += 1) {
      c = (c & 1) !== 0
        ? (0xEDB88320 ^ (c >>> 1))
        : (c >>> 1)
    }

    table[index] = c >>> 0
  }

  return table
}

function concatUint8Arrays(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }

  return result
}

function writeUint32BE(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = (value >>> 24) & 0xFF
  buffer[offset + 1] = (value >>> 16) & 0xFF
  buffer[offset + 2] = (value >>> 8) & 0xFF
  buffer[offset + 3] = value & 0xFF
}
