/**
 * Find the end index of a subroutine.
 *
 * A Subroutine starts with *<value> and ends with [s] or [return]
 */
export function findSubroutineEndIndex(currentIndex: number, lines: string[]) {
  if (lines.length === 0) {
    return -1
  }

  const isSubroutine = lines[currentIndex].startsWith('*')

  if (!isSubroutine) {
    return -1
  }

  let nestedLevel = 0

  for (let i = currentIndex; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('*')) {
      nestedLevel += 1
    }

    if (line.startsWith('[s]') || line.startsWith('[return]')) {
      nestedLevel -= 1
    }

    if (nestedLevel === 0) {
      return i
    }
  }

  // if no end marker is found, the subroutine is considered to be open-ended
  return lines.length - 1
}
