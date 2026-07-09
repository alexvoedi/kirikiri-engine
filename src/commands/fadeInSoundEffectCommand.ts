import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createIntegerSchema } from '../schemas'
import { checkCondition } from '../utils/checkCondition'
import { getSeVolume } from './seOptionCommand'

const schema = z.object({
  storage: z.string(),
  time: createIntegerSchema(),
  buf: z.string().optional(),
  loop: z.string().transform(value => value === 'true').optional(),
  cond: z.string().optional(),
}).strict()

/**
 * Implements the `fadeinse` command.
 *
 * Plays a sound effect and fades it in to the configured SE volume.
 */
export async function fadeInSoundEffectCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)
  const result = parsed.cond ? await checkCondition(engine, parsed.cond) : true

  if (!result) {
    return
  }

  const fullPath = await engine.getAssetUrl(parsed.storage)
  const audio = new Audio(fullPath)
  const buf = parsed.buf ?? '0'
  const targetVolume = getSeVolume(engine, buf)

  engine.commandStorage.playse?.byBuffer?.[buf]?.cleanup?.()

  if (parsed.loop !== undefined) {
    audio.loop = parsed.loop
  }

  audio.volume = 0

  let disposed = false
  let fadeInterval: ReturnType<typeof setInterval> | undefined

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
    if (disposed) {
      return
    }

    disposed = true

    if (fadeInterval) {
      clearInterval(fadeInterval)
    }

    audio.pause()
    audio.removeEventListener('canplay', onCanPlay)
    audio.removeEventListener('ended', onEnded)
    globalThis.removeEventListener(EngineEvent.STOP_SE, onStop)

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

    syncLegacyState()
  }

  function onStop(event: Event) {
    const stopEvent = event as CustomEvent<{ buf?: string }>

    if (stopEvent.detail?.buf && stopEvent.detail.buf !== buf) {
      return
    }

    cleanup()
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.SOUND_EFFECT_ENDED, {
      detail: {
        buf,
      },
    }))
  }

  function onEnded() {
    cleanup()
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.SOUND_EFFECT_ENDED, {
      detail: {
        buf,
      },
    }))
  }

  function onCanPlay() {
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
    void audio.play()

    const fadeStep = 50
    const volumeStep = targetVolume / Math.max(1, parsed.time / fadeStep)

    fadeInterval = setInterval(() => {
      if (audio.volume + volumeStep >= targetVolume) {
        audio.volume = targetVolume
        if (fadeInterval) {
          clearInterval(fadeInterval)
        }
      }
      else {
        audio.volume += volumeStep
      }
    }, fadeStep)
  }

  audio.addEventListener('canplay', onCanPlay, { once: true })
  audio.addEventListener('ended', onEnded, { once: true })
  globalThis.addEventListener(EngineEvent.STOP_SE, onStop)

  return new Promise((resolve) => {
    audio.addEventListener('canplay', () => {
      resolve()
    }, { once: true })
  })
}
