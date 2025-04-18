import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas'

const schema = z.object({
  canskip: createBooleanSchema().optional(),
}).strict()

/**
 * Implements the `wl` command.
 *
 * Waits for the background music to finish playing.
 */
export async function waitForBackgroundMusicCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  const playing = engine.commandStorage.playse?.playing ?? false

  return new Promise((resolve) => {
    if (!playing) {
      resolve()
    }
    else {
      const handleSoundEffectEnded = () => {
        window.removeEventListener('wl', handleSoundEffectEnded)
        resolve()
      }

      window.addEventListener('wl', handleSoundEffectEnded)
    }
  })
}
