import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas'
import { checkCondition } from '../utils/checkCondition'

const schema = z.object({
  canskip: createBooleanSchema().optional(),
  cond: z.string().optional(),
  buf: z.string().optional(),
}).strict()

/**
 * Implements the `ws` command.
 *
 * Waits for a sound effect to finish playing.
 */
export async function waitForSoundEffectCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const isConditionMet = parsed.cond ? await checkCondition(engine, parsed.cond) : true

  const playing = engine.commandStorage.playse?.playing ?? false

  return new Promise((resolve) => {
    if (!isConditionMet || !playing) {
      resolve()
    }
    else {
      const handleSoundEffectEnded = () => {
        window.removeEventListener('ws', handleSoundEffectEnded)
        resolve()
      }

      window.addEventListener('ws', handleSoundEffectEnded)
    }
  })
}
