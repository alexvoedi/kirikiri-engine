import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({
  buf: z.string().optional(),
  cond: z.string().optional(),
}).strict()

/**
 * Implements the `stopbgm` command.
 *
 * Stops the background music.
 */
export async function stopBackgroundMusicCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  const stopBackgroundMusicNotifier = new CustomEvent(EngineEvent.STOP_BGM)
  globalThis.dispatchEvent(stopBackgroundMusicNotifier)
}
