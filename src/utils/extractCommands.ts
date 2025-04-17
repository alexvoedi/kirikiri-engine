import { extractCommand } from './extractCommand'

interface Command {
  command: string
  props: Record<string, string>
}

/**
 * Find all the commands in a string.
 */
export function extractCommands(text: string): {
  length: number
  commands: Array<Command>
} {
  const commands: Array<Command> = []

  let index = 0
  let whitespaces = 0
  while (index < text.length) {
    const char = text[index]

    if (char === ' ' || char === '\n' || char === '\t') {
      whitespaces++
      index++
      continue
    }

    if (char === '[') {
      whitespaces = 0

      const endIndex = text.indexOf(']', index)

      if (endIndex === -1) {
        throw new Error(`Unmatched [ at index ${index}`)
      }

      const command = extractCommand(text.slice(index, endIndex + 1))

      commands.push(command)

      index = endIndex + 1

      continue
    }

    break
  }

  return {
    length: index - whitespaces,
    commands,
  }
}
