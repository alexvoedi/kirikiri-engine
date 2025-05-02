/**
 * Extract the command and its properties from a line of text.
 */
export function extractCommand(text: string, index = 0) {
  const singleLineCommand = /@(.*)/.exec(text)
  const basicCommand = /\[(.*?)\]/.exec(text.slice(index))

  const commandLine = singleLineCommand?.[1] ?? basicCommand?.[1]

  if (!commandLine) {
    throw new Error(`Invalid command line: ${text}`)
  }

  const parts = commandLine
    .match(/(?:[^\s"']|"[^"]*"|'[^']*')+/g) // Match words or quoted substrings

  if (!parts?.length) {
    throw new Error(`Invalid command line: ${text}`)
  }

  const [command, ...keyValueStrings] = parts

  const props = keyValueStrings.reduce((acc, keyValueString) => {
    const match = /^([^=]+)=(.+)$/.exec(keyValueString)
    if (match) {
      const key = match[1]
      const value = match[2]

      acc[key] = value
        .replace(/(^['"])|(['"]$)/g, '') // Remove quotes
    }

    return acc
  }, {} as Record<string, string>)

  const openingBracketIndex = text.indexOf('[', index)
  const closingBracketIndex = text.indexOf(']', openingBracketIndex)

  return {
    command,
    props,
    from: openingBracketIndex > -1 ? openingBracketIndex : index,
    to: closingBracketIndex > -1 ? closingBracketIndex : text.length,
  }
}
