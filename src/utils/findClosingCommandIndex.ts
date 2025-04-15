import { COMMAND_BLOCKS } from '../constants'
import { checkIsBlockCommand } from './checkIsBlockCommand'

/**
 * Gets the position of the closing command in the text
 */
export function findClosingCommandIndex(command: string, openPos: number, text: string) {
  const isBlockCommand = checkIsBlockCommand(command)

  if (!isBlockCommand) {
    throw new Error(`The command "${command}" is not a block command.`)
  }

  const closingCommandBlock = COMMAND_BLOCKS[command]

  return text.indexOf(closingCommandBlock, openPos)
}
