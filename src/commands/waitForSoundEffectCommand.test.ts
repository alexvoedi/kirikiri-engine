import { describe, expect, it } from 'vitest'
import { EngineEvent } from '../constants'
import { setupEngine } from '../testSetup'
import { waitForSoundEffectCommand } from './waitForSoundEffectCommand'

describe('waitForSoundEffectCommand', () => {
  it('resolves immediately when no sound effect is playing', async () => {
    const engine = await setupEngine()

    await expect(waitForSoundEffectCommand(engine, {})).resolves.toBeUndefined()
  })

  it('waits for sound effect completion', async () => {
    const engine = await setupEngine()
    engine.commandStorage.playse = {
      playing: true,
    }

    const promise = waitForSoundEffectCommand(engine, {})
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.SOUND_EFFECT_ENDED))

    await expect(promise).resolves.toBeUndefined()
  })

  it('waits for the matching sound effect buffer', async () => {
    const engine = await setupEngine()
    engine.commandStorage.playse = {
      byBuffer: {
        2: {
          playing: true,
        },
      },
    }

    const promise = waitForSoundEffectCommand(engine, {
      buf: '2',
    })

    globalThis.dispatchEvent(new CustomEvent(EngineEvent.SOUND_EFFECT_ENDED, {
      detail: {
        buf: '1',
      },
    }))

    let resolved = false
    void promise.then(() => {
      resolved = true
    })

    await Promise.resolve()
    expect(resolved).toBe(false)

    globalThis.dispatchEvent(new CustomEvent(EngineEvent.SOUND_EFFECT_ENDED, {
      detail: {
        buf: '2',
      },
    }))

    await expect(promise).resolves.toBeUndefined()
  })
})
