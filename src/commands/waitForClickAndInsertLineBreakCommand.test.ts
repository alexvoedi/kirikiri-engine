import { describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { waitForClickAndInsertLineBreakCommand } from './waitForClickAndInsertLineBreakCommand'

describe('waitForClickAndInsertLineBreakCommand', () => {
  it('inserts a linebreak only after a canvas click', async () => {
    const engine = await setupEngine()
    const addCharacter = vi.spyOn(engine, 'addCharacter').mockResolvedValue(undefined)
    let resolved = false

    const promise = waitForClickAndInsertLineBreakCommand(engine, {}).then(() => {
      resolved = true
    })

    globalThis.dispatchEvent(new Event('click'))
    await Promise.resolve()
    expect(resolved).toBe(false)
    expect(addCharacter).not.toHaveBeenCalled()

    engine.canvas.dispatchEvent(new MouseEvent('click'))
    await promise

    expect(addCharacter).toHaveBeenCalledWith('\n')
  })
})
