import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { checkCondition } from '../utils/checkCondition'

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

  const fullPath = engine.getFullFilePath(parsed.storage)

  const audio = new Audio(fullPath)

  if (parsed.loop !== undefined) {
    audio.loop = parsed.loop
  }

  const waitForSoundEffectNotifier = new CustomEvent('ws')

  audio.addEventListener('ended', () => {
    merge(engine.commandStorage, {
      playse: {
        playing: false,
      },
    })
    window.dispatchEvent(waitForSoundEffectNotifier)
  })

  window.addEventListener('stopse', () => {
    audio.pause()
    window.dispatchEvent(waitForSoundEffectNotifier)
  })

  return new Promise((resolve) => {
    audio.addEventListener('canplaythrough', () => {
      merge(engine.commandStorage, {
        playse: {
          playing: true,
        },
      })

      audio.play()

      resolve()
    })
  })
}
