type Result = Record<number, Array<{
  startIndex: number
  endIndex: number
  command: string
  props: Record<string, string>
}>>

export function removeCommandsFromText(text: string): {
  text: string
  commands: Result
} {
  const commands: Result = {}

  let textWithoutCommands = text
  let i = 0

  while (i < textWithoutCommands.length) {
    const start = textWithoutCommands.indexOf('[', i)
    const end = textWithoutCommands.indexOf(']', start)

    if (start === -1 || end === -1) {
      i++
      break
    }

    const command = textWithoutCommands.slice(start + 1, end)
    const [name, ...props] = command.split(' ')
    const propsObj: Record<string, string> = {}

    for (const prop of props) {
      const [key, value] = prop.split('=')
      propsObj[key] = value
    }

    textWithoutCommands = (textWithoutCommands.slice(0, start) + textWithoutCommands.slice(end + 1))
    textWithoutCommands = textWithoutCommands.replace(/ +/g, ' ')

    // this is necessary because
    if (!commands[start])
      commands[start] = []

    commands[start].push({
      startIndex: start,
      endIndex: end,
      command: name,
      props: propsObj,
    })
  }

  return {
    text: textWithoutCommands.trim(),
    commands,
  }
}
