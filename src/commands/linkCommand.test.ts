import { describe, expect, it, vi } from 'vitest'
import { EngineState } from '../enums/EngineState'
import { setupEngine } from '../testSetup'
import { linkCommand } from './linkCommand'

describe('linkCommand', () => {
  it('jumps to the selected target and resumes the engine', async () => {
    const engine = await setupEngine()
    const addLink = vi.spyOn(engine.renderer, 'addLink').mockImplementation(() => {})
    const run = vi.spyOn(engine, 'run').mockResolvedValue()

    engine.labels.first = {
      scene1: 2,
    }
    engine.commandStorage.link = {
      choices: [],
    }
    engine.callstack.push({
      file: 'first',
      lines: [
        '[link target=*scene1]Scene 1[endlink]',
        '[endlink]',
        '*scene1',
      ],
      index: 0,
    })
    engine.setState(EngineState.STOPPED)

    await linkCommand(engine, ['Scene 1'], { target: '*scene1' })

    const onClick = addLink.mock.calls[0]?.[1]
    expect(onClick).toBeDefined()

    await onClick?.()

    expect(engine.commandStorage.link).toEqual({})
    expect(engine.callstack.current.index).toBe(2)
    expect(engine.getState()).toBe(EngineState.RUNNING)
    expect(run).toHaveBeenCalledOnce()
  })

  it('applies inline locate and font tags before rendering link text', async () => {
    const engine = await setupEngine()
    const addLink = vi.spyOn(engine.renderer, 'addLink').mockImplementation(() => {})
    const setLocation = vi.spyOn(engine.renderer, 'setLocation')
    const setFont = vi.spyOn(engine.renderer, 'setFont')

    await linkCommand(engine, [
      '[locate x=20 y=150][font size=20 color=0xff0066 shadow=no]戻る[font size=default color=default shadow=default]',
    ], { target: '*back' })

    expect(setLocation).toHaveBeenCalledWith(20, 150)
    expect(setFont).toHaveBeenCalledWith({
      color: '0xff0066',
      shadow: 'no',
      size: 20,
    })
    expect(addLink).toHaveBeenCalledWith('戻る', expect.any(Function))
    expect(setFont).toHaveBeenLastCalledWith({
      color: 'default',
      shadow: 'default',
      size: 'default',
    })
  })
})
