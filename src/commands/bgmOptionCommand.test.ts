import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { bgmOptionCommand } from './bgmOptionCommand'
import { playBackgroundMusicCommand } from './playBackgroundMusicCommand'

describe('bgmOptionCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()
    vi.spyOn(engine, 'getAssetUrl').mockResolvedValue('https://example.com/bgm.ogg')
  })

  it('stores and applies configured bgm volume to newly played audio', async () => {
    const audio = {
      loop: false,
      src: '',
      volume: 1,
      play: vi.fn(),
      pause: vi.fn(),
      removeEventListener: vi.fn(),
      addEventListener(event: string, callback: (ev: Event) => void) {
        if (event === 'canplay') {
          callback(new Event('canplay'))
        }
      },
    } as unknown as HTMLAudioElement

    function AudioMock(this: HTMLAudioElement, src?: string) {
      if (src) {
        audio.src = src
      }

      return audio
    }

    vi.spyOn(globalThis, 'Audio').mockImplementation(AudioMock as unknown as typeof Audio)

    await bgmOptionCommand(engine, {
      volume: '100',
      gvolume: '40',
    })
    await playBackgroundMusicCommand(engine, {
      storage: 'bgm.ogg',
    })

    expect(audio.volume).toBeCloseTo(0.4)
  })
})
