import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema, createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  storage: z.string(),
  time: createIntegerSchema(),
  loop: createBooleanSchema().optional(),
}).strict()

/**
 * Implements the `fadeinbgm` command.
 *
 * Loads the audio file from the storage and fades it in.
 */
export async function fadeBackgroundMusicInCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const fullPath = engine.getFullFilePath(parsed.storage)

  const audio = new Audio(fullPath)

  if (parsed.loop !== undefined) {
    audio.loop = parsed.loop
  }

  audio.volume = 0
  audio.play()

  const fadeDuration = parsed.time
  const fadeStep = 50
  const volumeStep = 1 / (fadeDuration / fadeStep)

  return new Promise<void>((resolve) => {
    const fadeInterval = setInterval(() => {
      if (audio.volume + volumeStep >= 1) {
        audio.volume = 1
        clearInterval(fadeInterval)
        resolve()
      }
      else {
        audio.volume += volumeStep
      }
    }, fadeStep)
  })
}
