/**
 * Sanitize a line.
 *
 * - Remove leading and trailing whitespace
 * - Convert tabs to spaces
 */
export function sanitizeLine(line: string): string {
  // Remove leading and trailing whitespace
  line = line.trim()

  // Convert tabs to spaces
  line = line.replace(/\t/g, ' ')

  return line
}
