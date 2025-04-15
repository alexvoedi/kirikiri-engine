import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  time: createIntegerSchema(),
}).strict()

/**
 * Implements the `fadeoutbgm` command.
 */
export async function fadeOutBackgroundMusicCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const fadeOutBackgroundMusicNotifier = new CustomEvent('fadeoutbgm', {
    detail: {
      time: parsed.time,
    },
  })
  window.dispatchEvent(fadeOutBackgroundMusicNotifier)
}
