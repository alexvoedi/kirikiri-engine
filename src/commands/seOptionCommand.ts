import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { createIntegerSchema } from '../schemas'

const schema = z.object({
  buf: z.string().optional().default('0'),
  volume: createIntegerSchema(0, 100).optional(),
}).strict()

/**
 * Implements the `seopt` command.
 *
 * Stores per-buffer SE volume and applies it to the active SE buffer when possible.
 */
export async function seOptionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    seopt: {
      byBuffer: {
        [parsed.buf]: {
          volume: parsed.volume,
        },
      },
    },
  })

  const activeAudio = engine.commandStorage.playse?.audio

  if (activeAudio && engine.commandStorage.playse?.buf === parsed.buf) {
    activeAudio.volume = getSeVolume(engine, parsed.buf)
  }
}

export function getSeVolume(engine: KirikiriEngine, buf = '0') {
  const volume = engine.commandStorage.seopt?.byBuffer?.[buf]?.volume ?? 100

  return Math.max(0, Math.min(1, volume / 100))
}
