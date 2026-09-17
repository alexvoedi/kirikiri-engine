import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { playVideoCommand } from './playVideoCommand'

describe('playVideoCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()
    vi.spyOn(engine, 'getAssetUrl').mockResolvedValue('blob:video')
    vi.spyOn(engine.canvas, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 800,
      height: 600,
    } as DOMRect)
  })

  it('starts on canplay and resolves when the video ends', async () => {
    const play = vi.fn()
    const pause = vi.fn()
    const listeners: Record<string, Array<(event: Event) => void>> = {}
    const append = vi.fn()
    const load = vi.fn()
    const video = {
      style: {},
      src: '',
      autoplay: false,
      isConnected: true,
      play,
      pause,
      append,
      load,
      remove: vi.fn(),
      addEventListener(event: string, callback: (event: Event) => void) {
        listeners[event] ||= []
        listeners[event].push(callback)
      },
      removeEventListener(event: string, callback: (event: Event) => void) {
        listeners[event] = listeners[event]?.filter(listener => listener !== callback) ?? []
      },
    } as unknown as HTMLVideoElement

    const originalCreateElement = document.createElement.bind(document)

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'video') {
        return video
      }

      if (tagName === 'source') {
        return {
          src: '',
          type: '',
        } as HTMLSourceElement
      }

      return originalCreateElement(tagName)
    })

    await expect(playVideoCommand(engine, {
      storage: 'movie.mpg',
    })).resolves.toBeUndefined()

    listeners.canplay?.forEach(listener => listener(new Event('canplay')))

    expect(play).toHaveBeenCalledOnce()
    expect(append).toHaveBeenCalledOnce()
    expect(load).toHaveBeenCalledOnce()
    expect(engine.commandStorage.video?.playing).toBe(true)
    expect(engine.commandStorage.video?.pending).toBe(false)
    expect(video.style.position).toBe('fixed')
    expect(video.style.left).toBe('100px')
    expect(video.style.top).toBe('50px')
    expect(video.style.width).toBe('800px')
    expect(video.style.height).toBe('600px')

    listeners.ended?.forEach(listener => listener(new Event('ended')))
    expect(engine.commandStorage.video?.playing).toBe(false)
  })

  it('cleans up and ends waiting when the video errors', async () => {
    const listeners: Record<string, Array<(event: Event) => void>> = {}
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const video = {
      style: {},
      src: '',
      autoplay: false,
      isConnected: true,
      play: vi.fn(),
      pause: vi.fn(),
      append: vi.fn(),
      load: vi.fn(),
      remove: vi.fn(),
      addEventListener(event: string, callback: (event: Event) => void) {
        listeners[event] ||= []
        listeners[event].push(callback)
      },
      removeEventListener(event: string, callback: (event: Event) => void) {
        listeners[event] = listeners[event]?.filter(listener => listener !== callback) ?? []
      },
    } as unknown as HTMLVideoElement

    const originalCreateElement = document.createElement.bind(document)

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'video') {
        return video
      }

      if (tagName === 'source') {
        return {
          src: '',
          type: '',
        } as HTMLSourceElement
      }

      return originalCreateElement(tagName)
    })

    await expect(playVideoCommand(engine, {
      storage: 'movie.mpg',
    })).resolves.toBeUndefined()

    listeners.error?.forEach(listener => listener(new Event('error')))

    expect(video.pause).toHaveBeenCalledOnce()
    expect(video.remove).toHaveBeenCalledOnce()
    expect(engine.commandStorage.video?.playing).toBe(false)
    expect(error).toHaveBeenCalledWith('Video playback failed for movie.mpg')
  })
})
