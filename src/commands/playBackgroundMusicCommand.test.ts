import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { setupEngine } from '../testSetup'
import { playBackgroundMusicCommand } from './playBackgroundMusicCommand'

describe('playBackgroundMusicCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()

    vi.spyOn(engine, 'getFullFilePath').mockImplementation((filename: string) => {
      return `https://example.com/${filename}`
    })
  })

  it('plays background music', async () => {
    const audio = {
      loop: false,
      src: '',
    } as unknown as HTMLAudioElement

    vi.spyOn(window, 'Audio').mockImplementation((src?: string) => {
      if (src) {
        audio.src = src
      }

      audio.addEventListener = (event: string, callback: (ev: Event) => void) => {
        if (event === 'ended') {
          callback(new Event('ended'))
        }
      }

      audio.pause = vi.fn()

      return audio
    })

    const props = {
      storage: 'bgm.mp3',
      loop: 'true',
    }

    playBackgroundMusicCommand(engine, props)

    expect(engine.getFullFilePath).toHaveBeenCalledWith(props.storage)
    expect(audio.loop).toBe(true)
    expect(audio.src).toBe('https://example.com/bgm.mp3')
  })
})
