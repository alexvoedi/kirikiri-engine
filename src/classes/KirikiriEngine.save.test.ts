import type { KirikiriSaveGame } from '../types/KirikiriSaveGame'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  afterEach(() => {
    globalThis.localStorage.clear()
  })

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
      storage: 'bgm01.ogg',
      loop: true,
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
      storage: 'bgm01.ogg',
      loop: true,
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

  it('creates, lists, loads, and deletes named snapshots', async () => {
    const engine = await setupEngine()
    engine.setState(EngineState.PAUSED)
    engine.globalScriptContext.sf.firstclear = 23
    engine.callstack.push({
      file: 'first',
      lines: ['Visible preview text', '[s]'],
      index: 0,
    })

    const snapshot = engine.createSnapshot('Chapter 1')

    expect(snapshot.kind).toBe('snapshot')
    expect(snapshot.title).toBe('Chapter 1')
    expect(snapshot.preview).toBe('Visible preview text')
    expect(snapshot.saveGame.globalScriptContext.sf.firstclear).toBe(23)

    expect(engine.listSnapshots()).toHaveLength(1)
    expect(engine.listSnapshots()[0]).toMatchObject({
      kind: 'snapshot',
      id: snapshot.id,
      title: 'Chapter 1',
      preview: 'Visible preview text',
      saveGame: {
        globalScriptContext: {
          sf: {
            firstclear: 23,
          },
        },
      },
    })

    const restored = await setupEngine()
    mockRestorableFiles(restored)

    const loaded = await restored.loadSnapshot(snapshot.id, {
      resume: false,
    })

    expect(loaded.id).toBe(snapshot.id)
    expect(restored.globalScriptContext.sf.firstclear).toBe(23)
    expect(restored.callstack.current.index).toBe(0)
    expect(restored.getState()).toBe(EngineState.PAUSED)

    restored.deleteSnapshot(snapshot.id)
    expect(restored.listSnapshots()).toStrictEqual([])
  })

  it('resumes execution after loading a snapshot by default', async () => {
    const engine = await setupEngine()
    engine.setState(EngineState.PAUSED)
    engine.callstack.push({
      file: 'first',
      lines: ['*start', '[s]'],
      index: 1,
    })

    const snapshot = engine.createSnapshot('Resume point')

    const restored = await setupEngine()
    mockRestorableFiles(restored)
    const run = vi.spyOn(restored, 'run').mockResolvedValue()

    await restored.loadSnapshot(snapshot.id)

    expect(restored.getState()).toBe(EngineState.RUNNING)
    expect(run).toHaveBeenCalledOnce()
  })
})
