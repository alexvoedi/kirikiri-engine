import type { Game } from '../types/Game'
import type { StorageProvider } from '../types/StorageProvider'
import type { KirikiriEngine } from './KirikiriEngine'
import { createStorageProvider } from '../storage/createStorageProvider'
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
  private readonly storage: StorageProvider

  constructor({ engine, game }: {
    engine: KirikiriEngine
    game: Game
  }) {
    this.engine = engine
    this.game = game
    this.storage = createStorageProvider(game)
  }

  async processFile(filename: string): Promise<void> {
    const content = await this.storage.readTextFile(filename, 'shift-jis')

    const lines = splitAndSanitize(content)

    if (lines.length === 0) {
      throw new Error(`No lines found in ${filename}`)
    }

    this.animations[filename] = new KirikiriAnimation({
      lines,
    })
  }
}
