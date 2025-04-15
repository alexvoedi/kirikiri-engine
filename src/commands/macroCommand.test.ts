import type { Game } from '../types/Game'
import dotenv from 'dotenv'
import { KirikiriEngine } from '../classes/KirikiriEngine'
import { createMacro } from './macroCommand'

dotenv.config()

describe('macroCommand', () => {
  let engine: KirikiriEngine

  beforeAll(async () => {
    const root = process.env.GAME_ROOT ?? ''
    const url = new URL('/ojamajo/files.json', root)
    const files = await fetch(url)

    const game: Game = {
      root,
      entry: 'first.ks',
      files: await files.json(),
    }

    const container = document.createElement('div')

    engine = new KirikiriEngine({ container, game })
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
