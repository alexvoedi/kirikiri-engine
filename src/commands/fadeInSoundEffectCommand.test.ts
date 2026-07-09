import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { fadeInSoundEffectCommand } from './fadeInSoundEffectCommand'
import { seOptionCommand } from './seOptionCommand'

describe('fadeInSoundEffectCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()
    vi.spyOn(engine, 'getAssetUrl').mockResolvedValue('https://example.com/se.ogg')
  })

  it('fades in to the configured se volume', async () => {
    vi.useFakeTimers()

    try {
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

      await seOptionCommand(engine, {
        buf: '1',
        volume: '60',
      })

      await fadeInSoundEffectCommand(engine, {
        storage: 'voice.ogg',
        buf: '1',
        time: '200',
      })

      await vi.advanceTimersByTimeAsync(250)

      expect(audio.volume).toBeCloseTo(0.6)
      expect(audio.play).toHaveBeenCalled()
    }
    finally {
      vi.useRealTimers()
    }
  })
})
