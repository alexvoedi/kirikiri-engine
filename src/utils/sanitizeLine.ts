/**
 * Sanitize a line. Removes leading and trailing whitespaces and trailing backslashes.
 */
export function sanitizeLine(line: string): string {
  // Remove leading and trailing whitespace
  line = line.trim()

  // Remove trailing backslashes
  if (line.endsWith('\\')) {
    line = line.slice(0, -1)
  }

  return line
}
