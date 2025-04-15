import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  storage: z.string(),
  loop: z.string().transform(value => value === 'true').optional(),
}).strict()

/**
 * Implements the `playbgm` command.
 *
 * Loads the audio file from the storage and plays it.
 */
export async function playBackgroundMusicCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const fullPath = engine.getFullFilePath(parsed.storage)

  const audio = new Audio(fullPath)

  if (parsed.loop !== undefined) {
    audio.loop = parsed.loop
  }

  audio.play()
}
