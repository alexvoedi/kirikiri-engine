import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { playSoundEffectCommand } from './playSoundEffectCommand'
import { seOptionCommand } from './seOptionCommand'

describe('seOptionCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()
    vi.spyOn(engine, 'getAssetUrl').mockResolvedValue('https://example.com/se.ogg')
  })

  it('stores and applies per-buffer se volume to newly played audio', async () => {
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
      buf: '2',
      volume: '60',
    })
    await playSoundEffectCommand(engine, {
      storage: 'voice.ogg',
      buf: '2',
    })

    expect(audio.volume).toBeCloseTo(0.6)
  })
})
