import { describe, expect, it } from 'vitest'
import { decodeTlg } from './decodeTlg'

describe('decodeTlg', () => {
  it('decodes a minimal uncompressed TLG5 image', () => {
    const bytes = createMinimalTlg5Image()
    const image = decodeTlg(bytes)

    expect(image.width).toBe(2)
    expect(image.height).toBe(1)
    expect(Array.from(image.pixels)).toMatchInlineSnapshot(`
      [
        30,
        20,
        10,
        255,
        60,
        50,
        40,
        255,
      ]
    `)
  })
})

function createMinimalTlg5Image(): Uint8Array {
  const header = [
    0x54, 0x4C, 0x47, 0x35, 0x2E, 0x30, 0x00, 0x72, 0x61, 0x77, 0x1A,
    0x03,
    0x02, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]

  const blueChannel = [0x01, 0x02, 0x00, 0x00, 0x00, 0xF6, 0x00]
  const greenChannel = [0x01, 0x02, 0x00, 0x00, 0x00, 0x14, 0x1E]
  const redChannel = [0x01, 0x02, 0x00, 0x00, 0x00, 0x0A, 0x00]

  return new Uint8Array([
    ...header,
    ...blueChannel,
    ...greenChannel,
    ...redChannel,
  ])
}
