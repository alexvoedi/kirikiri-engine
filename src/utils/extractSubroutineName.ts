export function extractSubroutineName(line: string) {
  const match = /^\*(.+)/.exec(line) // find the name of the subroutine

  if (!match) {
    throw new Error(`Invalid jump point line: ${line}`)
  }

  const subroutineName = match[1].trim()

  if (!subroutineName) {
    throw new Error('Subroutine name is empty')
  }

  return subroutineName
}
