import { describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { callCommand } from './callCommand'
import { returnCommand } from './returnCommand'

describe('callCommand', () => {
  it('pushes a loaded script and advances the caller', async () => {
    const engine = await setupEngine()
    vi.spyOn(engine, 'loadFile').mockResolvedValue({
      file: 'plug_zoom',
      lines: ['[macro name=zoom]', '[endmacro]'],
      index: 0,
    })
    engine.callstack.push({
      file: 'first',
      lines: ['[call storage="plug_zoom.ks"]', '[jump target=*next]'],
      index: 0,
    })

    await callCommand(engine, {
      storage: 'plug_zoom.ks',
    })

    expect(engine.callstack.stack).toHaveLength(2)
    expect(engine.callstack.stack[0].index).toBe(1)
    expect(engine.callstack.current.file).toBe('plug_zoom')
  })

  it('skips missing optional call scripts without throwing', async () => {
    const engine = await setupEngine()
    const loggerWarn = vi.spyOn(engine.logger, 'warn')
    vi.spyOn(engine, 'loadFile').mockRejectedValue(new Error('File plug_zoom.ks not found'))
    engine.callstack.push({
      file: 'first',
      lines: ['[call storage="plug_zoom.ks"]', '[s]'],
      index: 0,
    })

    await expect(callCommand(engine, {
      storage: 'plug_zoom.ks',
    })).resolves.toBeUndefined()

    expect(engine.callstack.stack).toHaveLength(1)
    expect(engine.callstack.current.index).toBe(1)
    expect(loggerWarn).toHaveBeenCalledWith('Skipping call to plug_zoom.ks: Error: File plug_zoom.ks not found')
  })

  it('returns to the caller', async () => {
    const engine = await setupEngine()
    engine.callstack.push({
      file: 'first',
      lines: ['[call storage="plugin.ks"]', '[s]'],
      index: 1,
    })
    engine.callstack.push({
      file: 'plugin',
      lines: ['[return]'],
      index: 0,
    })

    await returnCommand(engine, {})

    expect(engine.callstack.stack).toHaveLength(1)
    expect(engine.callstack.current.file).toBe('first')
    expect(engine.callstack.current.index).toBe(1)
  })
})
