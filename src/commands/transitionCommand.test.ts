import { describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { transitionCommand } from './transitionCommand'

describe('transitionCommand', () => {
  it('accepts plugin transition method names', async () => {
    const engine = await setupEngine()
    const transition = vi.spyOn(engine.renderer, 'transition').mockImplementation(() => {})

    await transitionCommand(engine, {
      time: '300',
      method: 'wave',
    })

    expect(transition).toHaveBeenCalledWith({
      time: 300,
      method: 'wave',
      children: true,
    })
  })
})
