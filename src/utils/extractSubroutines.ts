import { extractSubroutineName } from './extractSubroutineName'
import { findSubroutineEndIndex } from './findSubroutineEndIndex'

export function extractSubroutines(lines: string[]) {
  let index = 0

  const subroutines: Record<string, string[]> = {}

  do {
    const line = lines[index]

    const firstCharacter = line.charAt(0)

    if (firstCharacter !== '*') {
      index += 1
      continue
    }

    const closingIndex = findSubroutineEndIndex(index, lines)

    if (closingIndex === -1) {
      throw new Error(`Could not find end of subroutine for ${line} at line ${index + 1}`)
    }

    const subroutineName = extractSubroutineName(line)

    const subroutineLines = lines.slice(index + 1, closingIndex)

    subroutines[subroutineName] = subroutineLines

    index += 1
  } while (index < lines.length)

  return subroutines
}
