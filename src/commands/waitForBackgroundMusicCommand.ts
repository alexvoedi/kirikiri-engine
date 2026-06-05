import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'
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

  const playing = engine.commandStorage.playbgm?.playing ?? false

  return new Promise((resolve) => {
    if (!playing) {
      resolve()
    }
    else {
      const handleBackgroundMusicEnded = () => {
        resolve()
      }

      globalThis.addEventListener(EngineEvent.BACKGROUND_MUSIC_ENDED, handleBackgroundMusicEnded, { once: true })
    }
  })
}
