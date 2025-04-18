/**
 * Check if the line is a comment.
 */
export function isComment(line: string) {
  return line.startsWith(';')
}
