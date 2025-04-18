/**
 * Check if there are multiple commands in a single line and split them.
 *
 * Example: [if exp="kag.clickCount!=0"][jump target=*buttontest][endif]
 * Example: [iscript]print("Hello, World!")[endscript]
 */
export function splitMultiCommandLine(line: string): string[] {
  const isCommandLine = line.startsWith('[')

  if (!isCommandLine) {
    return [line]
  }

  const regex = /(\[[^\]]+\])|([^[\]]+)/g

  const lines: string[] = []

  for (const match of line.matchAll(regex)) {
    const part = match[0].trim()

    lines.push(part)
  }

  return lines
}
