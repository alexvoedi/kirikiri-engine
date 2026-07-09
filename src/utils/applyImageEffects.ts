export interface ImageEffects {
  grayscale?: boolean
  rgamma?: number
  ggamma?: number
  bgamma?: number
}

export function applyImageEffectsToPixels(
  pixels: Uint8ClampedArray,
  effects: ImageEffects,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(pixels)
  const redGamma = normalizeGamma(effects.rgamma)
  const greenGamma = normalizeGamma(effects.ggamma)
  const blueGamma = normalizeGamma(effects.bgamma)

  for (let offset = 0; offset < result.length; offset += 4) {
    let red = result[offset]
    let green = result[offset + 1]
    let blue = result[offset + 2]

    if (effects.grayscale) {
      const luminance = Math.round(red * 0.299 + green * 0.587 + blue * 0.114)
      red = luminance
      green = luminance
      blue = luminance
    }

    result[offset] = applyGamma(red, redGamma)
    result[offset + 1] = applyGamma(green, greenGamma)
    result[offset + 2] = applyGamma(blue, blueGamma)
  }

  return result
}

function applyGamma(value: number, gamma: number) {
  const normalized = Math.min(1, Math.max(0, value / 255))

  return Math.round((normalized ** (1 / gamma)) * 255)
}

function normalizeGamma(value?: number) {
  if (value === undefined) {
    return 1
  }

  // The parser stores gamma values in a 0-255 range derived from the original
  // KAG gamma input range of 0.1..9.9.
  return 0.1 + (value / 255) * 9.8
}
