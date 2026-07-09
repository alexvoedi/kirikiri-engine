import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EngineEvent } from '../constants'
import { setupEngine } from '../testSetup'
import { fadeOutSoundEffectCommand } from './fadeOutSoundEffectCommand'

describe('fadeOutSoundEffectCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()
  })

  it('fades out only the targeted buffer and stops it', async () => {
    vi.useFakeTimers()

    try {
      const audio = {
        volume: 0.8,
      } as unknown as HTMLAudioElement
      const dispatchEvent = vi.spyOn(globalThis, 'dispatchEvent')

      engine.commandStorage.playse = {
        byBuffer: {
          2: {
            audio,
            cleanup: vi.fn(),
            playing: true,
          },
        },
      }

      const promise = fadeOutSoundEffectCommand(engine, {
        buf: '2',
        time: '200',
      })

      await vi.advanceTimersByTimeAsync(250)
      await promise

      expect(audio.volume).toBe(0)
      expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: EngineEvent.STOP_SE,
      }))
    }
    finally {
      vi.useRealTimers()
    }
  })
})
