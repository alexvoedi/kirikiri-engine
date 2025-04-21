/**
 * Check if the line is a command. A command stars with `[` and ends with `]` or it starts with `@`.
 *
 * TODO: Add the @ command check.
 */
export function checkIsCommand(line: string) {
  return (
    (line.startsWith('[') && line.endsWith(']') && line.length > 2)
  )
}
