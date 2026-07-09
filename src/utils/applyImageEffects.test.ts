import { describe, expect, it } from 'vitest'
import { applyImageEffectsToPixels } from './applyImageEffects'

describe('applyImageEffectsToPixels', () => {
  it('converts pixels to grayscale', () => {
    const pixels = new Uint8ClampedArray([
      255,
      0,
      0,
      255,
      0,
      255,
      0,
      255,
    ])

    const result = applyImageEffectsToPixels(pixels, {
      grayscale: true,
    })

    expect(result[0]).toBe(result[1])
    expect(result[1]).toBe(result[2])
    expect(result[4]).toBe(result[5])
    expect(result[5]).toBe(result[6])
  })

  it('applies per-channel gamma adjustments', () => {
    const pixels = new Uint8ClampedArray([
      120,
      120,
      120,
      255,
    ])

    const result = applyImageEffectsToPixels(pixels, {
      rgamma: 200,
      ggamma: 10,
      bgamma: 128,
    })

    expect(result[0]).not.toBe(result[1])
    expect(result[1]).not.toBe(result[2])
  })
})
