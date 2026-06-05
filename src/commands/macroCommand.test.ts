import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { setupEngine } from '../testSetup'
import { createMacro } from './macroCommand'

describe('macroCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()
  })

  it('can create a macro from lines', () => {
    const lines = [
      '[eval exp="x == 3"]',
    ]

    const macro = createMacro(engine, lines, {
      name: 'changeType_cross',
    })

    expect(macro.name).toBe('changeType_cross')
    expect(() => macro.macro({})).not.toThrowError()
  })

  it('can run a macro', () => {
    const lines = [
      '[macro name=cwt]',
      '[eval exp="kag.keyDownHook.add(myKeyDownHook)"]',
      '[wt canskip=false]',
      '[eval exp="kag.keyDownHook.remove(myKeyDownHook)"]',
      '[endmacro]',
    ]

    const macro = createMacro(engine, lines, {
      name: 'cwt',
    })
    expect(() => macro.macro({})).not.toThrowError()
  })

  it('can run a block command after earlier macro lines', async () => {
    const lines = [
      '[wait time=0]',
      '[iscript]',
      'sf.firstclear = 7;',
      '[endscript]',
    ]

    const macro = createMacro(engine, lines, {
      name: 'scripted',
    })

    await macro.macro({})

    expect(engine.globalScriptContext.sf.firstclear).toBe(7)
  })
})
