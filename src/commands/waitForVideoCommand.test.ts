import { describe, expect, it } from 'vitest'
import { EngineEvent } from '../constants'
import { setupEngine } from '../testSetup'
import { waitForVideoCommand } from './waitForVideoCommand'

describe('waitForVideoCommand', () => {
  it('resolves immediately when no video is playing', async () => {
    const engine = await setupEngine()

    await expect(waitForVideoCommand(engine, {})).resolves.toBeUndefined()
  })

  it('waits for video completion', async () => {
    const engine = await setupEngine()
    engine.commandStorage.video = {
      playing: true,
    }

    const promise = waitForVideoCommand(engine, {})
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.VIDEO_ENDED))

    await expect(promise).resolves.toBeUndefined()
  })

  it('allows click-to-skip when canskip is enabled', async () => {
    const engine = await setupEngine()
    engine.commandStorage.video = {
      playing: true,
    }

    const promise = waitForVideoCommand(engine, {
      canskip: 'true',
    })

    globalThis.dispatchEvent(new Event('click'))

    await expect(promise).resolves.toBeUndefined()
    expect(engine.globalScriptContext.kag.clickCount).toBe(1)
  })
})
