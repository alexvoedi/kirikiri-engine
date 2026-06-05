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
})
