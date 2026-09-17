import { extractCommand } from '../utils/extractCommand'

export interface AsdAnimationFrame {
  dx: number
  dy: number
  sx: number
  sy: number
  sw: number
  sh: number
  duration: number
}

export class AsdAnimation {
  private readonly lines: string[]
  private readonly macros = new Map<string, string[]>()

  constructor(content: string) {
    this.lines = content
      .split('\n')
      .map(line => line.replace(/\r/g, '').trim())

    this.collectMacros()
  }

  getFrames(options?: {
    startLabel?: string
  }): AsdAnimationFrame[] {
    const startLabel = options?.startLabel ?? '*start'
    const startIndex = this.lines.findIndex(line => line === startLabel)

    if (startIndex === -1) {
      return []
    }

    const frames: AsdAnimationFrame[] = []
    let currentFrame: AsdAnimationFrame | undefined

    const processLine = (line: string): boolean => {
      if (!line || line.startsWith(';') || line.startsWith('*')) {
        return false
      }

      const { command, props } = extractCommand(line)

      if (this.macros.has(command)) {
        for (const macroLine of this.macros.get(command) ?? []) {
          const expandedLine = macroLine.replace(/%(\w+)/g, (_, key: string) => props[key] ?? `%${key}`)
          if (processLine(expandedLine)) {
            return true
          }
        }

        return false
      }

      switch (command) {
        case 'copy':
          currentFrame = {
            dx: Number(props.dx ?? 0),
            dy: Number(props.dy ?? 0),
            sx: Number(props.sx ?? 0),
            sy: Number(props.sy ?? 0),
            sw: Number(props.sw ?? 0),
            sh: Number(props.sh ?? 0),
            duration: 0,
          }
          frames.push(currentFrame)
          return false
        case 'wait':
          if (currentFrame) {
            currentFrame.duration = Number(props.time ?? 0)
          }
          return false
        case 'jump':
          return props.target === startLabel
        default:
          return false
      }
    }

    for (let index = startIndex + 1; index < this.lines.length; index += 1) {
      if (processLine(this.lines[index])) {
        break
      }
    }

    return frames.filter(frame => frame.sw > 0 && frame.sh > 0)
  }

  private collectMacros() {
    for (let index = 0; index < this.lines.length; index += 1) {
      const line = this.lines[index]

      if (!line.startsWith('@macro')) {
        continue
      }

      const { props } = extractCommand(line)
      const name = props.name

      if (!name) {
        continue
      }

      const body: string[] = []
      index += 1

      while (index < this.lines.length && !this.lines[index].startsWith('@endmacro')) {
        body.push(this.lines[index])
        index += 1
      }

      this.macros.set(name, body)
    }
  }
}
