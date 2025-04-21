import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createIntegerSchema } from '../schemas'

const schema = z.object({
  time: createIntegerSchema(),
}).strict()

/**
 * Implements the `fadeoutbgm` command.
 *
 * Fades out the background music over a specified time.
 */
export async function fadeOutBackgroundMusicCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  window.dispatchEvent(new CustomEvent(EngineEvent.FADEOUT_BGM, {
    detail: {
      time: parsed.time,
    },
  }))
}
