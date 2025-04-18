export function scaleRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return Math.round(((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin)
}
