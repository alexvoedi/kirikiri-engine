import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

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

  const video = document.createElement('video')

  video.src = engine.getFullFilePath(parsed.storage)

  video.style.position = 'absolute'
  video.style.left = '0'
  video.style.top = '0'
  video.style.width = '100%'
  video.style.height = '100%'
  video.style.pointerEvents = 'none'
  video.autoplay = false
  video.style.backgroundColor = 'black'

  document.body.append(video)

  return new Promise((resolve) => {
    video.addEventListener('canplay', () => {
      video.play()
    })

    video.addEventListener('ended', () => {
      document.body.removeChild(video)
      resolve()
    })
  })
}
