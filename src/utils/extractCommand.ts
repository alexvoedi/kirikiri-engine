/**
 * Extract the command and its properties from a line of text.
 */
export function extractCommand(line: string) {
  const commandLine = /\[(.*?)\]/.exec(line)?.[1]

  if (!commandLine) {
    throw new Error(`Invalid command line: ${line}`)
  }

  const [command, ...keyValueStrings] = commandLine
    .match(/(?:[^\s"']|"[^"]*"|'[^']*')+/g) // Match words or quoted substrings
    ?.map(part => part.trim()) || [] // Trim each part

  const props = keyValueStrings.reduce((acc, keyValueString) => {
    const match = keyValueString.match(/^([^=]+)=(.+)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()

      acc[key] = value
        .replace(/(^['"])|(['"]$)/g, '') // Remove quotes
    }

    return acc
  }, {} as Record<string, string>)

  return { command, props }
}
