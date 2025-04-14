import { COMMAND_BLOCKS } from '../constants'
import { checkIsBlockCommand } from './checkIsBlockCommand'
import { checkIsCommand } from './checkIsCommand'
import { extractCommand } from './extractCommand'

/**
 * Find the corresponding closing block command index for a given block command.
 */
export function findClosingBlockCommandIndex(command: string, openPos: number, lines: string[]): number {
  const isBlockCommand = checkIsBlockCommand(command)

  if (!isBlockCommand) {
    throw new Error(`The command "${command}" is not a block command.`)
  }

  const closingCommandBlock = COMMAND_BLOCKS[command]

  let closePos = openPos
  let counter = 1
  while (counter > 0) {
    closePos++

    if (closePos >= lines.length) {
      return -1
    }

    const line = lines[closePos]

    const isCommand = checkIsCommand(line)

    if (!isCommand) {
      continue
    }

    const { command: extractedCommand } = extractCommand(line)

    // If the command is the same as the one we are looking for, increase the nested level
    if (extractedCommand === command) {
      counter += 1
    }

    // If the command is the closing block command, decrease the nested level
    if (extractedCommand === closingCommandBlock) {
      counter -= 1
    }
  }

  return closePos
}
