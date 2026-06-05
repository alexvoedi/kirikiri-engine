import { describe, expect, it } from 'vitest'
import { EngineEvent } from '../constants'
import { setupEngine } from '../testSetup'
import { waitForBackgroundMusicCommand } from './waitForBackgroundMusicCommand'

describe('waitForBackgroundMusicCommand', () => {
  it('resolves immediately when background music is not playing', async () => {
    const engine = await setupEngine()

    await expect(waitForBackgroundMusicCommand(engine, {})).resolves.toBeUndefined()
  })

  it('waits for background music completion', async () => {
    const engine = await setupEngine()
    engine.commandStorage.playbgm = {
      playing: true,
    }

    const promise = waitForBackgroundMusicCommand(engine, {})
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.BACKGROUND_MUSIC_ENDED))

    await expect(promise).resolves.toBeUndefined()
  })
})
