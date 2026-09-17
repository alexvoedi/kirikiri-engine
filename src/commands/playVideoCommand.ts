import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({
  storage: z.string(),
}).strict()

/**
 * Implements the `video` command.
 *
 * Plays a video.
 */
export async function playVideoCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)
  const videoOptions = engine.commandStorage.video

  videoOptions?.cleanup?.()

  const video = document.createElement('video')
  const displayScaleX = engine.canvas.clientWidth > 0
    ? engine.canvas.clientWidth / engine.renderer.RESOLUTION.WIDTH
    : engine.renderer.SCALE
  const displayScaleY = engine.canvas.clientHeight > 0
    ? engine.canvas.clientHeight / engine.renderer.RESOLUTION.HEIGHT
    : engine.renderer.SCALE
  const host = engine.canvas.parentElement ?? document.body

  video.src = await engine.getAssetUrl(parsed.storage)

  video.style.position = 'absolute'
  video.style.left = `${(videoOptions?.left ?? 0) * displayScaleX}px`
  video.style.top = `${(videoOptions?.top ?? 0) * displayScaleY}px`
  video.style.width = `${(videoOptions?.width ?? 800) * displayScaleX}px`
  video.style.height = `${(videoOptions?.height ?? 600) * displayScaleY}px`
  video.style.pointerEvents = 'none'
  video.autoplay = false
  video.style.backgroundColor = 'black'
  video.style.display = videoOptions?.visible === false ? 'none' : 'block'
  video.style.objectFit = 'fill'
  video.style.zIndex = '9000'

  host.append(video)

  let disposed = false

  function cleanup() {
    if (disposed) {
      return
    }

    disposed = true
    video.pause()
    video.removeEventListener('canplay', onCanPlay)
    video.removeEventListener('ended', onEnded)
    globalThis.removeEventListener(EngineEvent.STOP_VIDEO, onStop)

    if (video.isConnected) {
      video.remove()
    }

    merge(engine.commandStorage, {
      video: {
        cleanup: undefined,
        element: undefined,
        playing: false,
      },
    })
  }

  function onCanPlay() {
    merge(engine.commandStorage, {
      video: {
        cleanup,
        element: video,
        playing: true,
      },
    })
  }

  function onEnded() {
    cleanup()
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.VIDEO_ENDED))
  }

  function onStop() {
    cleanup()
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.VIDEO_ENDED))
  }

  video.addEventListener('canplay', onCanPlay, { once: true })
  video.addEventListener('ended', onEnded, { once: true })
  globalThis.addEventListener(EngineEvent.STOP_VIDEO, onStop, { once: true })

  return new Promise((resolve) => {
    video.addEventListener('canplay', () => {
      void video.play()
      resolve()
    }, { once: true })
  })
}
