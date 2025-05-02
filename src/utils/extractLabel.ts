/**
 * Given a line in the format `*<value>` get the value.
 */
export function extractLabel(line: string) {
  const match = /^\*(.*)/.exec(line)

  if (!match) {
    throw new Error(`Invalid label format: ${line}`)
  }

  const label = match[1]

  return label
}
