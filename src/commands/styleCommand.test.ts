import { describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { styleCommand } from './styleCommand'

describe('styleCommand', () => {
  it('stores and applies message text alignment', async () => {
    const engine = await setupEngine()
    const setStyle = vi.spyOn(engine.renderer, 'setStyle')

    await styleCommand(engine, {
      align: 'center',
    })

    expect(engine.commandStorage.style).toStrictEqual({
      align: 'center',
    })
    expect(setStyle).toHaveBeenCalledWith({
      align: 'center',
    })
  })
})
