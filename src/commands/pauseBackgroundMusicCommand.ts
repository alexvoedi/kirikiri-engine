import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({}).strict()

/**
 * Implements the `pausebgm` command.
 *
 * Pauses the currently playing background music.
 */
export async function pauseBackgroundMusicCommand(_: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  window.dispatchEvent(new CustomEvent(EngineEvent.PAUSE_BGM))
}
