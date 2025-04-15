/**
 * Check if the line is a command. A command stars with `[` and ends with `]` or it starts with `@`.
 */
export function checkIsCommand(line: string) {
  return (
    (line.startsWith('[') && line.endsWith(']') && line.length > 2)
    || (line.startsWith('@') && line.trim().length > 1)
  )
}
