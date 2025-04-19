/**
 * Scales a value from one range to another.
 * @param value The value to scale.
 * @param inMin The minimum value of the input range.
 * @param inMax The maximum value of the input range.
 * @param outMin The minimum value of the output range.
 * @param outMax The maximum value of the output range.
 */
export function scaleRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (value < inMin || value > inMax) {
    throw new Error(`Value ${value} is out of range [${inMin}, ${inMax}]`)
  }

  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}
