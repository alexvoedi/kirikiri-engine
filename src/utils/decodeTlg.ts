export interface TlgImage {
  width: number
  height: number
  pixels: Uint8Array
}

const TLG0_MAGIC = new Uint8Array([0x54, 0x4C, 0x47, 0x30, 0x2E, 0x30, 0x00, 0x73, 0x64, 0x73, 0x1A])
const TLG5_MAGIC = new Uint8Array([0x54, 0x4C, 0x47, 0x35, 0x2E, 0x30, 0x00, 0x72, 0x61, 0x77, 0x1A])

export function decodeTlg(bytes: Uint8Array): TlgImage {
  let offset = 0
  if (matchesMagic(bytes, 0, TLG0_MAGIC)) {
    const rawLength = readUInt32LE(bytes, 11)
    if (rawLength <= 0 || rawLength > (bytes.length - 15)) {
      throw new Error(`Invalid TLG0 raw length: ${rawLength}`)
    }

    offset = 15
  }

  if (!matchesMagic(bytes, offset, TLG5_MAGIC)) {
    throw new Error('Unsupported TLG format: only TLG5 is currently implemented')
  }

  offset += 11

  const colors = bytes[offset]
  offset += 1

  if (colors !== 3 && colors !== 4) {
    throw new Error(`Unsupported TLG5 color count: ${colors}`)
  }

  const width = readUInt32LE(bytes, offset)
  offset += 4
  const height = readUInt32LE(bytes, offset)
  offset += 4
  const blockHeight = readUInt32LE(bytes, offset)
  offset += 4

  const blockCount = Math.floor((height - 1) / blockHeight) + 1

  offset += blockCount * 4

  const pixels = new Uint8Array(width * height * 4)
  const text = new Uint8Array(4096)
  let textWriteIndex = 0
  let previousLineOffset = -1

  const expectedBlockLength = width * blockHeight

  for (let yBlock = 0; yBlock < height; yBlock += blockHeight) {
    const channels: Uint8Array[] = []

    for (let channel = 0; channel < colors; channel += 1) {
      const compressionFlag = bytes[offset]
      offset += 1

      const dataSize = readUInt32LE(bytes, offset)
      offset += 4

      const channelData = bytes.subarray(offset, offset + dataSize)
      offset += dataSize

      if (compressionFlag === 0) {
        channels.push(decompressTlgLzss(channelData, expectedBlockLength, text, textWriteIndex))
        textWriteIndex = decompressState.writeIndex
      }
      else {
        const copy = new Uint8Array(expectedBlockLength)
        copy.set(channelData.subarray(0, Math.min(channelData.length, expectedBlockLength)))
        channels.push(copy)
      }
    }

    const yLimit = Math.min(yBlock + blockHeight, height)
    const channelOffsets = new Array(colors).fill(0)

    for (let y = yBlock; y < yLimit; y += 1) {
      const currentLineOffset = y * width * 4

      if (previousLineOffset >= 0) {
        if (colors === 3) {
          composeTlg5Line3(pixels, currentLineOffset, previousLineOffset, channels, channelOffsets, width)
        }
        else {
          composeTlg5Line4(pixels, currentLineOffset, previousLineOffset, channels, channelOffsets, width)
        }
      }
      else {
        composeTlg5FirstLine(pixels, currentLineOffset, channels, channelOffsets, width, colors)
      }

      for (let channel = 0; channel < colors; channel += 1) {
        channelOffsets[channel] += width
      }

      previousLineOffset = currentLineOffset
    }
  }

  return {
    width,
    height,
    pixels,
  }
}

const decompressState = {
  writeIndex: 0,
}

function decompressTlgLzss(
  input: Uint8Array,
  expectedLength: number,
  text: Uint8Array,
  initialWriteIndex: number,
): Uint8Array {
  const output = new Uint8Array(expectedLength)
  let inputOffset = 0
  let outputOffset = 0
  let flags = 0
  let writeIndex = initialWriteIndex

  while (inputOffset < input.length && outputOffset < expectedLength) {
    if (((flags >>>= 1) & 0x100) === 0) {
      flags = input[inputOffset] | 0xFF00
      inputOffset += 1
    }

    if ((flags & 1) !== 0) {
      let matchPos = input[inputOffset] | ((input[inputOffset + 1] & 0x0F) << 8)
      let matchLength = (input[inputOffset + 1] & 0xF0) >>> 4
      inputOffset += 2

      matchLength += 3
      if (matchLength === 18) {
        matchLength += input[inputOffset]
        inputOffset += 1
      }

      while (matchLength > 0 && outputOffset < expectedLength) {
        const value = text[matchPos]
        output[outputOffset] = value
        text[writeIndex] = value

        outputOffset += 1
        writeIndex = (writeIndex + 1) & 0x0FFF
        matchPos = (matchPos + 1) & 0x0FFF
        matchLength -= 1
      }
    }
    else {
      const value = input[inputOffset]
      inputOffset += 1

      output[outputOffset] = value
      text[writeIndex] = value

      outputOffset += 1
      writeIndex = (writeIndex + 1) & 0x0FFF
    }
  }

  decompressState.writeIndex = writeIndex
  return output
}

function composeTlg5Line3(
  pixels: Uint8Array,
  currentLineOffset: number,
  previousLineOffset: number,
  channels: Uint8Array[],
  channelOffsets: number[],
  width: number,
): void {
  let previousBlue = 0
  let previousGreen = 0
  let previousRed = 0

  const blue = channels[0]
  const green = channels[1]
  const red = channels[2]

  for (let x = 0; x < width; x += 1) {
    const blueDiff = (blue[channelOffsets[0] + x] + green[channelOffsets[1] + x]) & 0xFF
    const greenDiff = green[channelOffsets[1] + x]
    const redDiff = (red[channelOffsets[2] + x] + green[channelOffsets[1] + x]) & 0xFF

    previousBlue = (previousBlue + blueDiff) & 0xFF
    previousGreen = (previousGreen + greenDiff) & 0xFF
    previousRed = (previousRed + redDiff) & 0xFF

    const pixelOffset = currentLineOffset + (x * 4)
    const upperOffset = previousLineOffset + (x * 4)

    pixels[pixelOffset] = (previousRed + pixels[upperOffset]) & 0xFF
    pixels[pixelOffset + 1] = (previousGreen + pixels[upperOffset + 1]) & 0xFF
    pixels[pixelOffset + 2] = (previousBlue + pixels[upperOffset + 2]) & 0xFF
    pixels[pixelOffset + 3] = 0xFF
  }
}

function composeTlg5Line4(
  pixels: Uint8Array,
  currentLineOffset: number,
  previousLineOffset: number,
  channels: Uint8Array[],
  channelOffsets: number[],
  width: number,
): void {
  let previousBlue = 0
  let previousGreen = 0
  let previousRed = 0
  let previousAlpha = 0

  const blue = channels[0]
  const green = channels[1]
  const red = channels[2]
  const alpha = channels[3]

  for (let x = 0; x < width; x += 1) {
    const blueDiff = (blue[channelOffsets[0] + x] + green[channelOffsets[1] + x]) & 0xFF
    const greenDiff = green[channelOffsets[1] + x]
    const redDiff = (red[channelOffsets[2] + x] + green[channelOffsets[1] + x]) & 0xFF
    const alphaDiff = alpha[channelOffsets[3] + x]

    previousBlue = (previousBlue + blueDiff) & 0xFF
    previousGreen = (previousGreen + greenDiff) & 0xFF
    previousRed = (previousRed + redDiff) & 0xFF
    previousAlpha = (previousAlpha + alphaDiff) & 0xFF

    const pixelOffset = currentLineOffset + (x * 4)
    const upperOffset = previousLineOffset + (x * 4)

    pixels[pixelOffset] = (previousRed + pixels[upperOffset]) & 0xFF
    pixels[pixelOffset + 1] = (previousGreen + pixels[upperOffset + 1]) & 0xFF
    pixels[pixelOffset + 2] = (previousBlue + pixels[upperOffset + 2]) & 0xFF
    pixels[pixelOffset + 3] = (previousAlpha + pixels[upperOffset + 3]) & 0xFF
  }
}

function composeTlg5FirstLine(
  pixels: Uint8Array,
  currentLineOffset: number,
  channels: Uint8Array[],
  channelOffsets: number[],
  width: number,
  colors: number,
): void {
  let previousBlue = 0
  let previousGreen = 0
  let previousRed = 0
  let previousAlpha = 0

  const blue = channels[0]
  const green = channels[1]
  const red = channels[2]
  const alpha = colors === 4 ? channels[3] : undefined

  for (let x = 0; x < width; x += 1) {
    const blueDiff = (blue[channelOffsets[0] + x] + green[channelOffsets[1] + x]) & 0xFF
    const greenDiff = green[channelOffsets[1] + x]
    const redDiff = (red[channelOffsets[2] + x] + green[channelOffsets[1] + x]) & 0xFF

    previousBlue = (previousBlue + blueDiff) & 0xFF
    previousGreen = (previousGreen + greenDiff) & 0xFF
    previousRed = (previousRed + redDiff) & 0xFF

    const pixelOffset = currentLineOffset + (x * 4)
    pixels[pixelOffset] = previousRed
    pixels[pixelOffset + 1] = previousGreen
    pixels[pixelOffset + 2] = previousBlue

    if (alpha) {
      previousAlpha = (previousAlpha + alpha[channelOffsets[3] + x]) & 0xFF
      pixels[pixelOffset + 3] = previousAlpha
    }
    else {
      pixels[pixelOffset + 3] = 0xFF
    }
  }
}

function readUInt32LE(buffer: Uint8Array, offset: number): number {
  return (
    buffer[offset]
    | (buffer[offset + 1] << 8)
    | (buffer[offset + 2] << 16)
    | (buffer[offset + 3] << 24)
  ) >>> 0
}

function matchesMagic(buffer: Uint8Array, offset: number, magic: Uint8Array): boolean {
  if (offset + magic.length > buffer.length) {
    return false
  }

  for (let index = 0; index < magic.length; index += 1) {
    if (buffer[offset + index] !== magic[index]) {
      return false
    }
  }

  return true
}
