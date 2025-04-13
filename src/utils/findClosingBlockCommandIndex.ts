import { COMMAND_BLOCKS } from '../constants'
import { checkIsBlockCommand } from './checkIsBlockCommand'
import { checkIsCommand } from './checkIsCommand'
import { extractCommand } from './extractCommand'

/**
 * Find the corresponding closing block command index for a given block command.
 */
export function findClosingBlockCommandIndex(command: string, currentIndex: number, lines: string[]): number {
  const isBlockCommand = checkIsBlockCommand(command)

  if (!isBlockCommand) {
    throw new Error(`The command "${command}" is not a block command.`)
  }

  const closingCommandBlock = COMMAND_BLOCKS[command]

  let nestedLevel = 0

  for (let i = currentIndex; i < lines.length; i++) {
    const line = lines[i]

    const isCommand = checkIsCommand(line)

    if (!isCommand) {
      // Not a command, skip to the next line
      continue
    }

    const { command: extractedCommand } = extractCommand(line)

    // If the command is the same as the one we are looking for, increase the nested level
    if (extractedCommand === command) {
      nestedLevel += 1
      continue
    }

    // If the command is the closing block command, decrease the nested level
    if (extractedCommand === closingCommandBlock) {
      nestedLevel -= 1
    }

    // If the nested level is zero, we found the closing block command
    if (nestedLevel === 0 && extractedCommand === closingCommandBlock) {
      return i
    }
  }

  // If no closing block command is found, return -1
  return -1
}
