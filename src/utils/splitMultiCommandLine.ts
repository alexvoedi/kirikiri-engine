import { checkIsCommand } from './checkIsCommand'

/**
 * Check if there are multiple commands in a single line and split them.
 *
 * Example: [if exp="kag.clickCount!=0"][jump target=*buttontest][endif]
 */
export function splitMultiCommandLine(line: string): string[] {
  const regex = /\[[^\]]+\]/g

  const lines: string[] = []

  line.matchAll(regex).forEach((match) => {
    const command = match[0]

    if (!checkIsCommand(command)) {
      throw new Error(`Malformed command: ${command}`)
    }

    lines.push(command)
  })

  return lines
}
