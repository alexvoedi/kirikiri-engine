import { COMMAND_BLOCKS } from '../constants'

/**
 * Checks if a command is a block command.
 */
export function checkIsBlockCommand(command: string) {
  const flatBlockCommands = Object.entries(COMMAND_BLOCKS).flat()

  return flatBlockCommands.includes(command)
}
