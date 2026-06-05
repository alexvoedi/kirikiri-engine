import type { KirikiriSaveGame } from '../types/KirikiriSaveGame'
import { describe, expect, it, vi } from 'vitest'
import { EngineState } from '../enums/EngineState'
import { setupEngine } from '../testSetup'

function mockRestorableFiles(engine: Awaited<ReturnType<typeof setupEngine>>) {
  return vi.spyOn(engine, 'loadFile').mockImplementation(async filename => ({
    file: filename,
    lines: ['*start', '[s]'],
    index: 0,
  }))
}

describe('kirikiriEngine save games', () => {
  it('creates a serializable save game snapshot', async () => {
    const engine = await setupEngine()
    const cleanup = vi.fn()
    const audio = new Audio('https://example.com/bgm.ogg')

    engine.setState(EngineState.PAUSED)
    engine.globalScriptContext.sf.firstclear = 4
    engine.globalScriptContext.f.testmode = 1
    engine.commandStorage.style = {
      align: 'center',
    }
    engine.commandStorage.playbgm = {
      audio,
      cleanup,
      playing: true,
    }
    engine.callstack.push({
      file: 'first',
      lines: ['*start', '[s]'],
      index: 1,
    })

    const saveGame = engine.createSaveGame()

    expect(() => JSON.stringify(saveGame)).not.toThrow()
    expect(saveGame.state).toBe(EngineState.PAUSED)
    expect(saveGame.callstack).toStrictEqual([
      {
        file: 'first',
        index: 1,
      },
    ])
    expect(saveGame.globalScriptContext.sf.firstclear).toBe(4)
    expect(saveGame.globalScriptContext.f.testmode).toBe(1)
    expect(saveGame.commandStorage.style).toStrictEqual({
      align: 'center',
    })
    expect(saveGame.commandStorage.playbgm).toStrictEqual({
      playing: true,
    })
  })

  it('restores script variables, command storage, state, and callstack', async () => {
    const engine = await setupEngine()
    const loadFile = mockRestorableFiles(engine)
    const saveGame: KirikiriSaveGame = {
      version: 1,
      createdAt: '2026-06-06T00:00:00.000Z',
      game: {
        entry: 'first.ks',
        root: '/mock/root',
      },
      state: EngineState.PAUSED,
      callstack: [
        {
          file: 'first',
          index: 1,
        },
      ],
      globalScriptContext: {
        kag: {
          clickCount: 2,
        },
        f: {
          testmode: 1,
        },
        sf: {
          firstclear: 7,
        },
      },
      commandStorage: {
        delay: {
          speed: 10,
        },
        style: {
          align: 'right',
        },
      },
      macros: [],
    }

    await engine.restoreSaveGame(saveGame)

    expect(loadFile).toHaveBeenCalledWith('first')
    expect(engine.getState()).toBe(EngineState.PAUSED)
    expect(engine.callstack.current).toStrictEqual({
      file: 'first',
      lines: ['*start', '[s]'],
      index: 1,
    })
    expect(engine.globalScriptContext.kag.clickCount).toBe(2)
    expect(engine.globalScriptContext.f).toStrictEqual({
      testmode: 1,
    })
    expect(engine.globalScriptContext.sf).toStrictEqual({
      firstclear: 7,
    })
    expect(engine.commandStorage).toStrictEqual({
      delay: {
        speed: 10,
      },
      style: {
        align: 'right',
      },
    })
  })

  it('saves to and loads from localStorage slots', async () => {
    const engine = await setupEngine()
    engine.globalScriptContext.sf.firstclear = 12
    engine.callstack.push({
      file: 'first',
      lines: ['*start', '[s]'],
      index: 1,
    })

    engine.saveGame('slot-1')

    const restored = await setupEngine()
    mockRestorableFiles(restored)

    await restored.loadSaveGame('slot-1')

    expect(restored.globalScriptContext.sf.firstclear).toBe(12)
    expect(restored.callstack.current.index).toBe(1)
  })

  it('rebuilds saved macros when restoring', async () => {
    const engine = await setupEngine()
    engine.callstack.push({
      file: 'first',
      lines: [
        '[macro name=setclear]',
        '[eval exp="sf.firstclear=42"]',
        '[endmacro]',
      ],
      index: 0,
    })

    await (engine as unknown as { processCurrentLine: () => Promise<void> }).processCurrentLine()

    const saveGame = engine.createSaveGame()
    const restored = await setupEngine()
    mockRestorableFiles(restored)
    restored.globalScriptContext.sf.firstclear = 0

    await restored.restoreSaveGame(saveGame)
    await restored.macros.setclear({})

    expect(restored.globalScriptContext.sf.firstclear).toBe(42)
  })
})
