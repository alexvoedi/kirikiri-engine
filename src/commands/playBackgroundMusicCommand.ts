import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { EngineEvent } from '../constants'

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

  const waitForBackgroundMusicNotifier = new CustomEvent('wl')

  audio.addEventListener('ended', () => {
    merge(engine.commandStorage, {
      playbgm: {
        playing: false,
      },
    })
    window.dispatchEvent(waitForBackgroundMusicNotifier)
  })

  audio.addEventListener(EngineEvent.FADEOUT_BGM, async (e) => {
    const customEvent = e as CustomEvent<{
      // time in milliseconds to fade out
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

    window.dispatchEvent(waitForBackgroundMusicNotifier)
  })

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
      audio.play()
      resolve()
    })
  })
}
