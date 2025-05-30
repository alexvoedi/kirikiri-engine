/**
 * Sanitize a line.
 *
 * This function removes leading and trailing whitespace, converts tabs to spaces,
 * removes trailing backslashes and pipes, and ensures that the line is properly formatted.
 */
export function sanitizeLine(line: string): string {
  // Remove leading and trailing whitespace
  line = line.trim()

  // Convert tabs to spaces
  line = line.replace(/\t/g, ' ')

  // Remove "\" and "\r" at the end of the line but only if there is nothing after it
  line = line.replace(/\\\s*$/, '')

  // Remove trailing pipe from the line if it is not followed by something else
  line = line.replace(/\|\s*$/, '')

  return line
}
