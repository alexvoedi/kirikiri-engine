import { checkIsCommand } from './checkIsCommand'
import { extractCommand } from './extractCommand'

export function extractStorage(line: string) {
  const isCommand = checkIsCommand(line)

  if (!isCommand) {
    return null
  }

  const { props } = extractCommand(line)

  if (props.storage) {
    if (props.storage.startsWith('%')) {
      return null
    }
    else {
      return props.storage
    }
  }
  else {
    return null
  }
}
