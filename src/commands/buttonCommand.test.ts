import { describe, expect, it, vi } from 'vitest'
import { EngineState } from '../enums/EngineState'
import { setupEngine } from '../testSetup'
import { buttonCommand } from './buttonCommand'

describe('buttonCommand', () => {
  it('jumps to the button target and resumes the engine', async () => {
    const engine = await setupEngine()
    const addButton = vi.spyOn(engine.renderer, 'addButton').mockResolvedValue()
    const run = vi.spyOn(engine, 'run').mockResolvedValue()

    engine.labels.first = {
      scene1: 1,
    }
    engine.callstack.push({
      file: 'first',
      lines: [
        '[button graphic="first.ks" target=*scene1]',
        '*scene1',
      ],
      index: 0,
    })
    engine.setState(EngineState.STOPPED)

    await buttonCommand(engine, {
      graphic: 'first.ks',
      target: '*scene1',
    })

    const callback = addButton.mock.calls[0]?.[0].callback
    expect(callback).toBeDefined()

    await callback?.()

    expect(engine.callstack.current.index).toBe(1)
    expect(engine.getState()).toBe(EngineState.RUNNING)
    expect(run).toHaveBeenCalledOnce()
  })

  it('does not render a button when its condition is false', async () => {
    const engine = await setupEngine()
    const addButton = vi.spyOn(engine.renderer, 'addButton').mockResolvedValue()
    engine.globalScriptContext.sf.firstclear = 0

    await buttonCommand(engine, {
      graphic: 'first.ks',
      target: '*scene1',
      cond: 'sf.firstclear==1',
    })

    expect(addButton).not.toHaveBeenCalled()
  })

  it('runs a button expression without requiring a target', async () => {
    const engine = await setupEngine()
    const addButton = vi.spyOn(engine.renderer, 'addButton').mockResolvedValue()

    await buttonCommand(engine, {
      graphic: 'first.ks',
      exp: 'sf.firstclear=3',
    })

    const callback = addButton.mock.calls[0]?.[0].callback
    expect(callback).toBeDefined()

    await expect(callback?.()).resolves.toBeUndefined()
    expect(engine.globalScriptContext.sf.firstclear).toBe(3)
  })
})
