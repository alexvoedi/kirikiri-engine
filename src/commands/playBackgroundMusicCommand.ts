import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createBooleanSchema, createIntegerSchema } from '../schemas'

const schema = z.object({
  storage: z.string(),
  loop: createBooleanSchema().optional().default(true),
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

  engine.commandStorage.playbgm?.cleanup?.()

  const audio = new Audio(fullPath)
  let disposed = false
  let fadeInterval: ReturnType<typeof setInterval> | undefined
  let resolveCanPlay: () => void = () => {}
  const canPlayPromise = new Promise<void>((resolve) => {
    resolveCanPlay = resolve
  })

  if (parsed.loop !== undefined) {
    audio.loop = parsed.loop
  }

  const waitForBackgroundMusicNotifier = new CustomEvent('wl')

  function cleanup(options?: {
    pause?: boolean
  }) {
    if (disposed)
      return

    disposed = true

    if (fadeInterval)
      clearInterval(fadeInterval)

    if (options?.pause !== false)
      audio.pause()

    audio.removeEventListener('ended', onEnded)
    audio.removeEventListener('canplay', onCanPlay)
    globalThis.removeEventListener(EngineEvent.FADEOUT_BGM, onFadeOut)
    globalThis.removeEventListener(EngineEvent.PAUSE_BGM, onPause)
    globalThis.removeEventListener(EngineEvent.RESUME_BGM, onResume)
    globalThis.removeEventListener(EngineEvent.STOP_BGM, onStop)

    merge(engine.commandStorage, {
      playbgm: {
        audio: undefined,
        cleanup: undefined,
        playing: false,
      },
    })
  }

  function onEnded() {
    cleanup({
      pause: false,
    })
    globalThis.dispatchEvent(waitForBackgroundMusicNotifier)
  }

  async function onFadeOut(e: Event) {
    const customEvent = e as CustomEvent<{
      time: number
    }>

    await new Promise<void>((resolve) => {
      fadeInterval = setInterval(() => {
        if (audio.volume > 0) {
          audio.volume = Math.max(0, audio.volume - 0.01)
        }
        else {
          if (fadeInterval)
            clearInterval(fadeInterval)
          resolve()
        }
      }, customEvent.detail.time / 100)
    })

    cleanup()
    globalThis.dispatchEvent(waitForBackgroundMusicNotifier)
  }

  function onPause() {
    audio.pause()
  }

  function onResume() {
    audio.play()
  }

  function onStop() {
    cleanup()
    globalThis.dispatchEvent(waitForBackgroundMusicNotifier)
  }

  function onCanPlay() {
    audio.removeEventListener('canplay', onCanPlay)

    merge(engine.commandStorage, {
      playbgm: {
        audio,
        cleanup,
        playing: true,
      },
    })

    if (parsed.time) {
      audio.volume = 0

      audio.play()

      const fadeDuration = parsed.time
      const fadeStep = 50
      const volumeStep = 1 / (fadeDuration / fadeStep)

      fadeInterval = setInterval(() => {
        if (audio.volume + volumeStep >= 1) {
          audio.volume = 1
          if (fadeInterval)
            clearInterval(fadeInterval)
        }
        else {
          audio.volume += volumeStep
        }
      }, fadeStep)
    }
    else {
      audio.play()
    }

    resolveCanPlay()
  }

  merge(engine.commandStorage, {
    playbgm: {
      audio,
      cleanup,
      playing: false,
    },
  })

  audio.addEventListener('ended', onEnded)
  audio.addEventListener('canplay', onCanPlay)
  globalThis.addEventListener(EngineEvent.FADEOUT_BGM, onFadeOut)
  globalThis.addEventListener(EngineEvent.PAUSE_BGM, onPause)
  globalThis.addEventListener(EngineEvent.RESUME_BGM, onResume)
  globalThis.addEventListener(EngineEvent.STOP_BGM, onStop)

  return canPlayPromise
}
