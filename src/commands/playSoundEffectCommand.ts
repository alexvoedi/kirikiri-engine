import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { checkCondition } from '../utils/checkCondition'
import { getSeVolume } from './seOptionCommand'

const schema = z.object({
  storage: z.string(),
  buf: z.string().optional(),
  loop: z.string().transform(value => value === 'true').optional(),
  cond: z.string().optional(),
}).strict()

/**
 * Implements the `playse` command.
 *
 * Loads the audio file from the storage and plays it.
 */
export async function playSoundEffectCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const result = parsed.cond ? await checkCondition(engine, parsed.cond) : true

  if (!result) {
    return
  }

  const fullPath = await engine.getAssetUrl(parsed.storage)

  const audio = new Audio(fullPath)
  const buf = parsed.buf ?? '0'

  if (parsed.loop !== undefined) {
    audio.loop = parsed.loop
  }

  audio.volume = getSeVolume(engine, buf)

  engine.commandStorage.playse?.byBuffer?.[buf]?.cleanup?.()

  function syncLegacyState() {
    const active = engine.commandStorage.playse?.byBuffer?.[buf]

    merge(engine.commandStorage, {
      playse: {
        audio: active?.audio,
        buf,
        cleanup: active?.cleanup,
        playing: active?.playing ?? false,
      },
    })
  }

  function cleanup() {
    merge(engine.commandStorage, {
      playse: {
        byBuffer: {
          [buf]: {
            audio: undefined,
            cleanup: undefined,
            playing: false,
          },
        },
      },
    })

    globalThis.removeEventListener(EngineEvent.STOP_SE, onStop)
    syncLegacyState()
  }

  function onStop(event: Event) {
    const stopEvent = event as CustomEvent<{ buf?: string }>

    if (stopEvent.detail?.buf && stopEvent.detail.buf !== buf) {
      return
    }

    audio.pause()
    cleanup()
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.SOUND_EFFECT_ENDED, {
      detail: {
        buf,
      },
    }))
  }

  audio.addEventListener('ended', () => {
    cleanup()
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.SOUND_EFFECT_ENDED, {
      detail: {
        buf,
      },
    }))
  })

  globalThis.addEventListener(EngineEvent.STOP_SE, onStop)

  return new Promise((resolve) => {
    audio.addEventListener('canplay', () => {
      merge(engine.commandStorage, {
        playse: {
          byBuffer: {
            [buf]: {
              audio,
              cleanup,
              playing: true,
            },
          },
        },
      })

      syncLegacyState()
      audio.play()

      resolve()
    })
  })
}
