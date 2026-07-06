import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { setupEngine } from '../testSetup'
import { playBackgroundMusicCommand } from './playBackgroundMusicCommand'

describe('playBackgroundMusicCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()

    vi.spyOn(engine, 'getAssetUrl').mockImplementation(async (filename: string) => `https://example.com/${filename}`)
  })

  it('plays background music', async () => {
    const audio = {
      loop: false,
      src: '',
      play: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLAudioElement

    function AudioMock(src?: string) {
      if (src) {
        audio.src = src
      }

      audio.addEventListener = (event: string, callback: (ev: Event) => void) => {
        if (event === 'canplay') {
          callback(new Event('canplay'))
        }
      }

      audio.pause = vi.fn()

      return audio
    }

    vi.spyOn(globalThis, 'Audio').mockImplementation(AudioMock)

    const props = {
      storage: 'bgm.mp3',
      loop: 'true',
    }

    await playBackgroundMusicCommand(engine, props)

    expect(engine.getAssetUrl).toHaveBeenCalledWith(props.storage)
    expect(audio.loop).toBe(true)
    expect(audio.src).toBe('https://example.com/bgm.mp3')
  })

  it('stops the previous background music before playing a new track', async () => {
    const audios: Array<HTMLAudioElement & {
      listeners: Record<string, Array<(ev: Event) => void>>
      pause: ReturnType<typeof vi.fn>
      play: ReturnType<typeof vi.fn>
      src: string
    }> = []

    function AudioMock(src?: string) {
      const audio = {
        listeners: {},
        loop: false,
        pause: vi.fn(),
        play: vi.fn(),
        src: src ?? '',
        volume: 1,
        addEventListener(event: string, callback: (ev: Event) => void) {
          this.listeners[event] ||= []
          this.listeners[event].push(callback)

          if (event === 'canplay') {
            callback(new Event('canplay'))
          }
        },
        removeEventListener(event: string, callback: (ev: Event) => void) {
          this.listeners[event] = this.listeners[event]?.filter(listener => listener !== callback) ?? []
        },
      } as HTMLAudioElement & {
        listeners: Record<string, Array<(ev: Event) => void>>
        pause: ReturnType<typeof vi.fn>
        play: ReturnType<typeof vi.fn>
        src: string
      }

      audios.push(audio)

      return audio
    }

    vi.spyOn(globalThis, 'Audio').mockImplementation(AudioMock)

    await playBackgroundMusicCommand(engine, {
      storage: 'm60.ogg',
    })
    await playBackgroundMusicCommand(engine, {
      storage: 'bgm-v01.ogg',
    })

    expect(audios[0].pause).toHaveBeenCalledOnce()
    expect(audios[1].play).toHaveBeenCalledOnce()
    expect(engine.commandStorage.playbgm?.audio?.src).toBe('https://example.com/bgm-v01.ogg')
    expect(engine.commandStorage.playbgm?.playing).toBe(true)
  })
})
