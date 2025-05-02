/**
 * Extract the command and its properties from a line of text.
 */
export function extractCommand(text: string) {
  const match = /\[(.*)\]|@(.*)/.exec(text)
  const commandLine = match?.[1] || match?.[2]

  if (!commandLine) {
    throw new Error(`Invalid command line: ${text}`)
  }

  const parts = commandLine
    .match(/(?:[^\s"']|"[^"]*"|'[^']*')+/g) // Match words or quoted substrings

  if (!parts?.length) {
    throw new Error(`Invalid command line: ${text}`)
  }

  const [command, ...keyValueStrings] = parts.map(s => s.trim())

  const props = keyValueStrings.reduce((acc, keyValueString) => {
    const match = /^([^=]+)=(.+)$/.exec(keyValueString)
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
