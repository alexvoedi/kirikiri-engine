import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
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

  const waitForBackgroundMusicNotifier = new CustomEvent('wl')

  audio.addEventListener('ended', () => {
    merge(engine.commandStorage, {
      playbgm: {
        playing: false,
      },
    })
    window.dispatchEvent(waitForBackgroundMusicNotifier)
  })

  audio.addEventListener('fadeoutbgm', (e) => {
    const customEvent = e as CustomEvent<{
      time: number
    }>

    const _fadeOutTime = customEvent.detail.time

    audio.volume = 0

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
