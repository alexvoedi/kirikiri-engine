import { describe, expect, it } from 'vitest'
import { setupEngine } from '../testSetup'
import { waitForClickCommand } from './waitForClickCommand'

describe('waitForClickCommand', () => {
  it('resolves only for clicks on the game canvas', async () => {
    const engine = await setupEngine()
    let resolved = false

    const promise = waitForClickCommand(engine, {}).then(() => {
      resolved = true
    })

    globalThis.dispatchEvent(new Event('click'))
    await Promise.resolve()
    expect(resolved).toBe(false)

    engine.canvas.dispatchEvent(new MouseEvent('click'))
    await promise

    expect(resolved).toBe(true)
    expect(engine.globalScriptContext.kag.clickCount).toBe(1)
  })
})
