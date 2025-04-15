type Result = Record<string, {
  startIndex: number
  endIndex: number
  command: string
  props: Record<string, string>
}>

/**
 * Extract all commands from a text.
 */
export function extractCommands(text: string): Result {
  const result: Result = {}

  for (let i = 0; i < text.length; i++) {
    const start = text.indexOf('[', i)
    const end = text.indexOf(']', start)

    if (start === -1 || end === -1)
      break

    const command = text.slice(start + 1, end)
    const [name, ...props] = command.split(' ')
    const propsObj: Record<string, string> = {}

    for (const prop of props) {
      const [key, value] = prop.split('=')
      propsObj[key] = value
    }

    result[i] = {
      startIndex: start,
      endIndex: end,
      command: name,
      props: propsObj,
    }

    i = end
  }

  return result
}
