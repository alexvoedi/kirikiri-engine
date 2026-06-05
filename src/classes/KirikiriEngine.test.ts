import { describe, expect, it } from 'vitest'
import { setupEngine } from '../testSetup'

describe('kirikiriEngine', () => {
  it('processes block commands from the current callstack line', async () => {
    const engine = await setupEngine()

    engine.callstack.push({
      file: 'first',
      lines: [
        '[wait time=0]',
        '[iscript]',
        'sf.firstclear = 9;',
        '[endscript]',
        '[wait time=0]',
      ],
      index: 1,
    })

    await (engine as unknown as { processCurrentLine: () => Promise<void> }).processCurrentLine()

    expect(engine.callstack.current.index).toBe(4)
    expect(engine.globalScriptContext.sf.firstclear).toBe(9)
  })

  it('processes inline link block commands as a single text tag', async () => {
    const engine = await setupEngine()
    const addLink = vi.spyOn(engine.renderer, 'addLink').mockImplementation(() => {})
    const loggerError = vi.spyOn(engine.logger, 'error')

    engine.callstack.push({
      file: 'first',
      lines: [
        '[link target=*s1]０１．プロローグ[endlink]',
      ],
      index: 0,
    })

    await engine.processText()

    expect(addLink).toHaveBeenCalledWith('０１．プロローグ', expect.any(Function))
    expect(loggerError).not.toHaveBeenCalled()
  })

  it('processes current-line link block commands without parsing endlink separately', async () => {
    const engine = await setupEngine()
    const addLink = vi.spyOn(engine.renderer, 'addLink').mockImplementation(() => {})
    const loggerError = vi.spyOn(engine.logger, 'error')

    engine.callstack.push({
      file: 'first',
      lines: [
        '[link target=*s1]０１．プロローグ　　　　　　　　　　　　　　[endlink]',
      ],
      index: 0,
    })

    await (engine as unknown as { processCurrentLine: () => Promise<void> }).processCurrentLine()

    expect(addLink).toHaveBeenCalledWith('０１．プロローグ　　　　　　　　　　　　　　', expect.any(Function))
    expect(loggerError).not.toHaveBeenCalled()
    expect(engine.callstack.current.index).toBe(1)
  })

  it('processes single-line if blocks without parsing endif separately', async () => {
    const engine = await setupEngine()
    const loggerWarn = vi.spyOn(engine.logger, 'warn')

    engine.callstack.push({
      file: 'first',
      lines: [
        '[if exp="3==3"][eval exp="sf.firstclear=12"][endif]',
      ],
      index: 0,
    })

    await (engine as unknown as { processCurrentLine: () => Promise<void> }).processCurrentLine()

    expect(loggerWarn).not.toHaveBeenCalledWith(expect.stringContaining('Unknown command: endif'))
    expect(engine.globalScriptContext.sf.firstclear).toBe(12)
    expect(engine.callstack.current.index).toBe(1)
  })

  it('skips single-line if block content when the condition is false', async () => {
    const engine = await setupEngine()
    const loggerWarn = vi.spyOn(engine.logger, 'warn')
    engine.globalScriptContext.sf.firstclear = 0

    engine.callstack.push({
      file: 'first',
      lines: [
        '[if exp="3==4"][eval exp="sf.firstclear=12"][endif]',
      ],
      index: 0,
    })

    await (engine as unknown as { processCurrentLine: () => Promise<void> }).processCurrentLine()

    expect(loggerWarn).not.toHaveBeenCalledWith(expect.stringContaining('Unknown command: endif'))
    expect(engine.globalScriptContext.sf.firstclear).toBe(0)
    expect(engine.callstack.current.index).toBe(1)
  })

  it('stops processing the current line after a jump changes the callstack index', async () => {
    const engine = await setupEngine()

    engine.labels.first = {
      target: 1,
    }
    engine.globalScriptContext.sf.firstclear = 0
    engine.callstack.push({
      file: 'first',
      lines: [
        '[jump target=*target][eval exp="sf.firstclear=99"]',
        '*target',
        '[eval exp="sf.firstclear=1"]',
      ],
      index: 0,
    })

    await (engine as unknown as { processCurrentLine: () => Promise<void> }).processCurrentLine()

    expect(engine.callstack.current.index).toBe(1)
    expect(engine.globalScriptContext.sf.firstclear).toBe(0)
  })
})
