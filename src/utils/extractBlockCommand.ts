import { COMMAND_BLOCKS } from '../constants'
import { checkIsBlockCommand } from './checkIsBlockCommand'
import { extractCommand } from './extractCommand'

/**
 * Find the corresponding closing block command index for a given block command.
 */
export function extractBlockCommand(openingBlockCommand: string, lines: string[], index = 0): {
  from: {
    line: number
    col: number
  }
  to: {
    line: number
    col: number
  }
  content: string[]
} {
  if (!checkIsBlockCommand(openingBlockCommand)) {
    throw new Error(`Command "${openingBlockCommand}" is not a block command.`)
  }

  const closingBlockCommand = COMMAND_BLOCKS[openingBlockCommand]

  const { from: fromStart, to: toStart } = extractCommand(lines[0], index)

  let lineIndex = 0
  let columnIndex = index
  let nestedCounter = 0

  while (lineIndex < lines.length) {
    const line = lines[lineIndex]

    while (columnIndex < line.length) {
      if (line[columnIndex] === '[') {
        const { command, from: fromEnd, to: toEnd } = extractCommand(line, columnIndex)

        if (command === openingBlockCommand) {
          nestedCounter++
        }
        else if (command === closingBlockCommand) {
          nestedCounter--
        }

        if (nestedCounter === 0) {
          const content: string[] = []

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (i === 0) {
              if (i === lineIndex) {
                const newContent = line.slice(toStart + 1, fromEnd)
                if (newContent)
                  content.push(newContent)
              }
              else {
                const newContent = line.slice(toStart + 1)
                if (newContent)
                  content.push(newContent)
              }
            }
            else if (i > 0 && i < lineIndex) {
              content.push(line)
            }
            else if (i === lineIndex) {
              const newContent = line.slice(0, fromEnd)
              if (newContent)
                content.push(newContent)
            }
          }

          return {
            from: {
              line: 0,
              col: fromStart,
            },
            to: {
              line: lineIndex,
              col: toEnd,
            },
            content,
          }
        }

        columnIndex = toEnd + 1
        continue
      }

      columnIndex++
    }

    lineIndex++
    columnIndex = 0
  }

  throw new Error(`No closing block command found for "${openingBlockCommand}".`)
}
