import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { describe, expect, it } from 'vitest'
import { EngineEvent } from '../constants'
import { setupEngine } from '../testSetup'
import { waitForMoveCommand } from './waitForMoveCommand'

describe('waitForMoveCommand', () => {
  it('resolves immediately when no move is active', async () => {
    const engine = await setupEngine()

    await expect(waitForMoveCommand(engine, {})).resolves.toBeUndefined()
  })

  it('waits for move completion and clears the moving flag', async () => {
    const engine: KirikiriEngine = await setupEngine()
    engine.commandStorage.move = {
      moving: true,
    }

    const promise = waitForMoveCommand(engine, {})
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.MOVE_ENDED))

    await expect(promise).resolves.toBeUndefined()
    expect(engine.commandStorage.move?.moving).toBe(false)
  })
})
