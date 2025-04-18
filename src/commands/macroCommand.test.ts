import type { KirikiriEngine } from '../classes/KirikiriEngine'
import dotenv from 'dotenv'
import { setupEngine } from '../testSetup'
import { createMacro } from './macroCommand'

dotenv.config()

describe('macroCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()
  })

  it('can create a macro from lines', () => {
    const lines = [
      '[eval exp="x == 3"]',
    ]

    const macro = createMacro(engine, {
      name: 'changeType_cross',
      lines,
    })

    expect(macro.name).toBe('changeType_cross')
    expect(() => macro.macro({})).not.toThrowError()
  })

  it('can run a mscro', () => {
    const lines = [
      '[macro name=cwt]',
      '[eval exp="kag.keyDownHook.add(myKeyDownHook)"]',
      '[wt canskip=false]',
      '[eval exp="kag.keyDownHook.remove(myKeyDownHook)"]',
      '[endmacro]',
    ]

    const macro = createMacro(engine, {
      name: 'cwt',
      lines,
    })
    expect(() => macro.macro({})).not.toThrowError()
  })
})
