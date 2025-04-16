import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  time: createIntegerSchema(),
}).strict()

/**
 * Implements the `fadeoutbgm` command.
 */
export async function fadeOutBackgroundMusicCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  window.dispatchEvent(new CustomEvent(EngineEvent.FADEOUT_BGM, {
    detail: parsed,
  }))
}
