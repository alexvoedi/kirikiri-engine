import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EngineEvent } from '../constants'
import { setupEngine } from '../testSetup'
import { waitForTransitionCommand } from './waitForTransitionCommand'

describe('waitForTransitionCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()

    vi.spyOn(engine.renderer, 'moveAndChangeOpacity').mockImplementation(() => {

    })
  })

  it('should resolve immediately if transitioning is false', async () => {
    const props = {}

    await expect(waitForTransitionCommand(engine, props)).resolves.toBeUndefined()
  })

  it('should wait for transition to end', async () => {
    engine.commandStorage.trans = {
      transitioning: true,
    }

    const props = {}

    const promise = waitForTransitionCommand(engine, props)

    window.dispatchEvent(new CustomEvent(EngineEvent.TRANSITION_ENDED))

    await expect(promise).resolves.toBeUndefined()
  })
})
