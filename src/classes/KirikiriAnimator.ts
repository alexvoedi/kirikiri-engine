import type { Game } from '../types/Game'
import type { KirikiriEngine } from './KirikiriEngine'
import { loadFileContent } from '../utils/loadFile'
import { splitAndSanitize } from '../utils/splitAndSanitize'
import { KirikiriAnimation } from './KirikiriAnimation'

export class KirikiriAnimator {
  /**
   * Kirikiri engine instance.
   */
  readonly engine: KirikiriEngine

  /**
   * Game data.
   */
  readonly game: Game

  /**
   * The registered animations.
   */
  readonly animations: Record<string, KirikiriAnimation> = {}

  constructor({ engine, game }: {
    engine: KirikiriEngine
    game: Game
  }) {
    this.engine = engine
    this.game = game
  }

  async processFile(filename: string): Promise<void> {
    const content = await loadFileContent(filename, this.game.root, this.game.files)

    const lines = splitAndSanitize(content)

    if (lines.length === 0) {
      throw new Error(`No lines found in ${filename}`)
    }

    this.animations[filename] = new KirikiriAnimation({
      lines,
    })
  }
}
