import { COMMAND_BLOCKS } from '../constants'

/**
 * Checks if a command is a block command.
 */
export function checkIsBlockCommand(command: string) {
  const flatBlockCommands = Object.keys(COMMAND_BLOCKS).flat()

  return flatBlockCommands.includes(command)
}
