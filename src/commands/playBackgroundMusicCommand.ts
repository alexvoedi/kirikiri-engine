import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  storage: z.string(),
  loop: z.string().transform(value => value === 'true').optional(),
  time: createIntegerSchema().optional(),
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

  const waitForBackgroundMusicNotifier = new CustomEvent('wl')

  audio.addEventListener('ended', () => {
    merge(engine.commandStorage, {
      playbgm: {
        playing: false,
      },
    })
    window.dispatchEvent(waitForBackgroundMusicNotifier)
  })

  const onFadeOut = async (e: Event) => {
    const customEvent = e as CustomEvent<{
      time: number
    }>

    await new Promise<void>((resolve) => {
      const fadeOutInterval = setInterval(() => {
        if (audio.volume > 0) {
          audio.volume = Math.max(0, audio.volume - 0.01)
        }
        else {
          clearInterval(fadeOutInterval)
          resolve()
        }
      }, customEvent.detail.time / 100)
    })

    merge(engine.commandStorage, {
      playbgm: {
        playing: false,
      },
    })

    audio.pause()

    window.dispatchEvent(waitForBackgroundMusicNotifier)
    window.removeEventListener(EngineEvent.FADEOUT_BGM, onFadeOut)
  }

  window.addEventListener(EngineEvent.FADEOUT_BGM, onFadeOut)

  window.addEventListener('stopbgm', () => {
    audio.pause()
    window.dispatchEvent(waitForBackgroundMusicNotifier)
  })

  return new Promise((resolve) => {
    audio.addEventListener('canplaythrough', () => {
      merge(engine.commandStorage, {
        playbgm: {
          playing: true,
        },
      })

      if (parsed.time) {
        audio.volume = 0

        audio.play()

        const fadeDuration = parsed.time
        const fadeStep = 50
        const volumeStep = 1 / (fadeDuration / fadeStep)

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
      }
      else {
        audio.play()
      }

      resolve()
    })
  })
}
