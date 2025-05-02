import { extractCommand } from './extractCommand'

interface Command {
  command: string
  props: Record<string, string>
  from: number
  to: number
}

/**
 * Find all the commands in a string.
 */
export function extractCommands(text: string): Array<Command> {
  const commands: Array<Command> = []

  let index = 0
  while (index < text.length) {
    const char = text[index]

    if (char === '[' || char === '@') {
      const command = extractCommand(text, index)

      commands.push(command)

      index = command.to + 1
    }
    else {
      index++
    }
  }

  return commands
}
