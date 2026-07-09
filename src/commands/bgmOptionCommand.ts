import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { createIntegerSchema } from '../schemas'

const schema = z.object({
  volume: createIntegerSchema(0, 100).optional(),
  gvolume: createIntegerSchema(0, 100).optional(),
}).strict()

/**
 * Implements the `bgmopt` command.
 *
 * Stores and applies basic BGM volume settings used by the game scripts.
 */
export async function bgmOptionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    bgmopt: parsed,
  })

  const audio = engine.commandStorage.playbgm?.audio

  if (audio) {
    audio.volume = getBgmVolume(engine)
  }
}

export function getBgmVolume(engine: KirikiriEngine) {
  const volume = engine.commandStorage.bgmopt?.volume ?? 100
  const gvolume = engine.commandStorage.bgmopt?.gvolume ?? 100

  return Math.max(0, Math.min(1, (volume / 100) * (gvolume / 100)))
}
