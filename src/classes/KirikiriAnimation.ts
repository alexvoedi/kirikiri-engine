import { extractSubroutines } from '../utils/extractSubroutines'

export class KirikiriAnimation {
  /**
   * The lines of the animation file.
   */
  readonly lines: string[]

  /**
   * All available subroutines grouped by script.
   */
  readonly subroutines: Record<string, string[]> = {}

  private loop: boolean = false

  constructor({
    lines,
  }: {
    lines: string[]
  }) {
    this.lines = lines

    this.subroutines = extractSubroutines(this.lines)
  }

  processLines(): void {
    let index = 0

    do {
      const line = this.lines[index]

      try {
        // TODO
      }
      catch (error) {
        console.error(`Error processing line ${index}: ${line}`, error)
        index += 1
      }
    } while (index < this.lines.length)
  }

  play(): void {
    // TODO
  }

  stop(): void {
    // TODO
  }
}
