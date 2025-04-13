/**
 * Extract the command and its properties from a line of text.
 */
export function extractCommand(line: string) {
  const commandLine = /\[(.*?)\]/.exec(line)?.[1]

  if (!commandLine) {
    throw new Error(`Invalid command line: ${line}`)
  }

  const [command, ...keyValueStrings] = commandLine
    .split(' ')
    .filter(str => str.trim() !== '')

  const props = keyValueStrings.reduce((acc, keyValueString) => {
    const [key, value] = keyValueString.split('=')

    if (key && value) {
      acc[key] = value.replace(/(^['"])|(['"]$)/g, '')
    }

    return acc
  }, {} as Record<string, string>)

  return { command, props }
}
