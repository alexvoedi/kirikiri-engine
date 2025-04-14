/**
 * Find the end index of a subroutine.
 *
 * A Subroutine starts with *<value> and ends with [s] or [return]
 */
export function findSubroutineEndIndex(openPos: number, lines: string[]) {
  if (lines.length === 0) {
    return -1
  }

  const isSubroutine = lines[openPos].startsWith('*')

  if (!isSubroutine) {
    return -1
  }

  let closePos = openPos
  let counter = 1
  while (counter > 0) {
    closePos++

    if (closePos >= lines.length) {
      return lines.length - 1
    }

    const line = lines[closePos]

    if (line.startsWith('*')) {
      counter += 1
    }

    if (line.startsWith('[s]') || line.startsWith('[return]')) {
      counter -= 1
    }
  }

  return closePos
}
