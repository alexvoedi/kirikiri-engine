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
  const videoUrl = await engine.getAssetUrl(parsed.storage)

  videoOptions?.cleanup?.()

  const video = document.createElement('video')
  const source = document.createElement('source')
  const host = document.body

  const syncVideoBounds = () => {
    const rect = engine.canvas.getBoundingClientRect()
    const displayScaleX = rect.width > 0
      ? rect.width / engine.renderer.RESOLUTION.WIDTH
      : engine.renderer.SCALE
    const displayScaleY = rect.height > 0
      ? rect.height / engine.renderer.RESOLUTION.HEIGHT
      : engine.renderer.SCALE

    video.style.left = `${rect.left + ((videoOptions?.left ?? 0) * displayScaleX)}px`
    video.style.top = `${rect.top + ((videoOptions?.top ?? 0) * displayScaleY)}px`
    video.style.width = `${(videoOptions?.width ?? engine.renderer.RESOLUTION.WIDTH) * displayScaleX}px`
    video.style.height = `${(videoOptions?.height ?? engine.renderer.RESOLUTION.HEIGHT) * displayScaleY}px`
  }

  source.src = videoUrl
  source.type = inferVideoMimeType(parsed.storage)
  video.append(source)

  video.style.position = 'fixed'
  video.style.pointerEvents = 'none'
  video.autoplay = false
  video.playsInline = true
  video.preload = 'auto'
  video.style.backgroundColor = 'black'
  video.style.display = videoOptions?.visible === false ? 'none' : 'block'
  video.style.objectFit = 'fill'
  video.style.zIndex = '9000'

  syncVideoBounds()
  host.append(video)
  globalThis.addEventListener('resize', syncVideoBounds)
  globalThis.addEventListener('scroll', syncVideoBounds, { passive: true })

  merge(engine.commandStorage, {
    video: {
      cleanup,
      element: video,
      pending: true,
      playing: true,
    },
  })

  let disposed = false

  function cleanup() {
    if (disposed) {
      return
    }

    disposed = true
    video.pause()
    video.removeEventListener('canplay', onCanPlay)
    video.removeEventListener('ended', onEnded)
    video.removeEventListener('error', onError)
    video.removeEventListener('abort', onAbort)
    globalThis.removeEventListener(EngineEvent.STOP_VIDEO, onStop)
    globalThis.removeEventListener('resize', syncVideoBounds)
    globalThis.removeEventListener('scroll', syncVideoBounds)

    if (video.isConnected) {
      video.remove()
    }

    merge(engine.commandStorage, {
      video: {
        cleanup: undefined,
        element: undefined,
        pending: false,
        playing: false,
      },
    })
  }

  function onCanPlay() {
    merge(engine.commandStorage, {
      video: {
        cleanup,
        element: video,
        pending: false,
        playing: true,
      },
    })

    void video.play()
  }

  function onEnded() {
    cleanup()
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.VIDEO_ENDED))
  }

  function onStop() {
    cleanup()
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.VIDEO_ENDED))
  }

  function onError(event?: Event) {
    cleanup()
    const mediaError = (event?.target as HTMLVideoElement | undefined)?.error
    console.error(`Video playback failed for ${parsed.storage}${mediaError?.message ? `: ${mediaError.message}` : ''}`)
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.VIDEO_ENDED))
  }

  function onAbort() {
    cleanup()
    console.error(`Video playback was aborted for ${parsed.storage}`)
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.VIDEO_ENDED))
  }

  video.addEventListener('canplay', onCanPlay, { once: true })
  video.addEventListener('ended', onEnded, { once: true })
  video.addEventListener('error', onError, { once: true })
  video.addEventListener('abort', onAbort, { once: true })
  globalThis.addEventListener(EngineEvent.STOP_VIDEO, onStop, { once: true })
  video.load()

  return Promise.resolve()
}

function inferVideoMimeType(filename: string): string {
  const normalized = filename.toLowerCase()

  if (normalized.endsWith('.mp4')) {
    return 'video/mp4'
  }

  if (normalized.endsWith('.webm')) {
    return 'video/webm'
  }

  return 'video/mpeg'
}
