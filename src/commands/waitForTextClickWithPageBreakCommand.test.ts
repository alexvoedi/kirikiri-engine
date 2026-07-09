import { describe, expect, it } from 'vitest'
import { setupEngine } from '../testSetup'
import { waitForTextClickWithPageBreakCommand } from './waitForTextClickWithPageBreakCommand'

describe('waitForTextClickWithPageBreakCommand', () => {
  it('waits only for clicks on the game canvas', async () => {
    const engine = await setupEngine()
    let resolved = false

    const promise = waitForTextClickWithPageBreakCommand(engine, {}).then(() => {
      resolved = true
    })

    globalThis.dispatchEvent(new Event('click'))
    await Promise.resolve()
    expect(resolved).toBe(false)

    engine.canvas.dispatchEvent(new MouseEvent('click'))
    await promise

    expect(resolved).toBe(true)
  })
})
