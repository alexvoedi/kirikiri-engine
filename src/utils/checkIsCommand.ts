/**
 * Check if the line is a command. A command stars with `[` and ends with `]`.
 */
export function checkIsCommand(line: string) {
  return line.startsWith('[') && line.endsWith(']')
}
