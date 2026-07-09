import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createIntegerSchema } from '../schemas'

const schema = z.object({
  time: createIntegerSchema(),
  buf: z.string().optional().default('0'),
}).strict()

/**
 * Implements the `fadeoutse` command.
 *
 * Fades out and stops the currently playing SE buffer.
 */
export async function fadeOutSoundEffectCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)
  const entry = engine.commandStorage.playse?.byBuffer?.[parsed.buf]
  const audio = entry?.audio

  if (!audio || !entry?.playing) {
    return
  }

  const startVolume = audio.volume
  const fadeStep = 50
  const totalSteps = Math.max(1, Math.ceil(parsed.time / fadeStep))
  const volumeStep = startVolume / totalSteps

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (audio.volume <= volumeStep) {
        audio.volume = 0
        clearInterval(interval)
        resolve()
      }
      else {
        audio.volume = Math.max(0, audio.volume - volumeStep)
      }
    }, fadeStep)
  })

  globalThis.dispatchEvent(new CustomEvent(EngineEvent.STOP_SE, {
    detail: {
      buf: parsed.buf,
    },
  }))
}
