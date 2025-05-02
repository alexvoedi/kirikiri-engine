export class Callstack {
  stack: Array<{
    file: string
    lines: string[]
    index: number
  }> = []

  push(entry: {
    file: string
    lines: string[]
    index: number
  }) {
    this.stack.push(entry)
  }

  replace(entry: {
    file: string
    lines: string[]
    index: number
  }, index?: number) {
    if (index === undefined) {
      if (this.stack.length > 0) {
        this.stack[this.stack.length - 1] = entry
      }
      else {
        this.stack.push(entry)
      }
    }
    else {
      if (index < 0 || index >= this.stack.length) {
        throw new Error(`Invalid index ${index}. The stack must remain continuous.`)
      }
      this.stack[index] = entry
    }
  }

  get current() {
    if (this.stack.length === 0) {
      throw new Error('Callstack is empty')
    }

    return this.stack[this.stack.length - 1]
  }

  get currentLine() {
    if (this.stack.length === 0) {
      throw new Error('Callstack is empty')
    }

    return this.current.lines[this.current.index]
  }
}
