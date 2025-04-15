import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `wl` command.
 *
 * Waits for the background music to finish playing.
 */
export async function waitForBackgroundMusicCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  return new Promise((resolve) => {
    const handleSoundEffectEnded = () => {
      window.removeEventListener('wl', handleSoundEffectEnded)
      resolve()
    }

    window.addEventListener('wl', handleSoundEffectEnded)
  })
}
