import { describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { jumpCommand } from './jumpCommand'

describe('jumpCommand', () => {
  it('jumps to a target in another script', async () => {
    const engine = await setupEngine()
    const loadFile = vi.spyOn(engine, 'loadFile').mockResolvedValue({
      file: 'menu',
      lines: ['*mainmenu', '[s]'],
      index: 0,
    })

    await jumpCommand(engine, {
      storage: 'menu.ks',
      target: '*mainmenu',
    })

    expect(loadFile).toHaveBeenCalledOnce()
    expect(loadFile).toHaveBeenCalledWith('menu.ks', 'mainmenu')
    expect(engine.callstack.current).toStrictEqual({
      file: 'menu',
      lines: ['*mainmenu', '[s]'],
      index: 0,
    })
  })
})
