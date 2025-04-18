/**
 * Transforms a move instruction string into an array of objects.
 *
 * @param text - The move instruction string, e.g. "(x,y,opacity) (x,y,opacity)".
 * @returns An array of objects, each containing x, y, and opacity properties.
 * @throws Will throw an error if the input string is not in the expected format.
 */
export function transformMoveInstruction(text: string): Array<{
  x: number
  y: number
  opacity: number
}> {
  return text.split(' ').map((point) => {
    const match = /^\(([-\d]+),([-\d]+),([-\d]+)\)$/.exec(point)
    if (!match) {
      throw new Error(`Invalid path format: ${point}`)
    }
    const [, x, y, opacity] = match
    return { x: Number(x), y: Number(y), opacity: Number(opacity) / 255 }
  })
}
