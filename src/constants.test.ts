import { COMMAND_BLOCKS, EngineEvent, GLOBAL_SCRIPT_CONTEXT, GLOBALS } from './constants'

describe('command_blocks', () => {
  it('should have correct mappings', () => {
    expect(COMMAND_BLOCKS.iscript).toBe('endscript')
    expect(COMMAND_BLOCKS.macro).toBe('endmacro')
    expect(COMMAND_BLOCKS.if).toBe('endif')
    expect(COMMAND_BLOCKS.link).toBe('endlink')
    expect(COMMAND_BLOCKS.indent).toBe('endindent')
  })
})

describe('globals', () => {
  it('should increment REGISTY_VALUE when readRegValue is called', () => {
    const initialValue = GLOBALS.System.readRegValue()
    expect(initialValue).toBe(54)
    const nextValue = GLOBALS.System.readRegValue()
    expect(nextValue).toBe(55)
  })

  it('should have default values for System', () => {
    expect(GLOBALS.System.shellExecute()).toBeNull()
    expect(GLOBALS.System.exePath).toBeUndefined()
    expect(GLOBALS.System.inform()).toBeNull()
    expect(GLOBALS.System.exit()).toBeNull()
  })

  it('should have default values for Storages', () => {
    expect(GLOBALS.Storages.getLocalName()).toBeNull()
  })

  it('should have default values for Plugins', () => {
    expect(GLOBALS.Plugins.link()).toBeNull()
  })

  it('should have default values for WaveSoundBuffer', () => {
    expect(GLOBALS.WaveSoundBuffer.freeDirectSound()).toBeNull()
  })

  it('should have a saveRegistry function', () => {
    expect(GLOBALS.saveRegistry()).toBeNull()
  })
})

describe('global_script_context', () => {
  it('should have default values for kag.bgm', () => {
    expect(GLOBAL_SCRIPT_CONTEXT.kag.bgm.buf1.volume2).toBeUndefined()
    expect(GLOBAL_SCRIPT_CONTEXT.kag.bgm.currentBuffer.status).toBeNull()
  })

  it('should have default values for kag.keyDownHook', () => {
    expect(GLOBAL_SCRIPT_CONTEXT.kag.keyDownHook.add()).toBeNull()
    expect(GLOBAL_SCRIPT_CONTEXT.kag.keyDownHook.remove()).toBeNull()
  })

  it('should have default values for kag', () => {
    expect(GLOBAL_SCRIPT_CONTEXT.kag.stopAllTransitions()).toBeNull()
    expect(GLOBAL_SCRIPT_CONTEXT.kag.clickCount).toBe(0)
  })

  it('should have default values for sf', () => {
    expect(GLOBAL_SCRIPT_CONTEXT.sf.firstclear).toBe(0)
  })

  it('should have default values for f', () => {
    expect(GLOBAL_SCRIPT_CONTEXT.f.testmode).toBe(0)
  })
})

describe('engineEvent', () => {
  it('should have correct event mappings', () => {
    expect(EngineEvent.CONTINUE).toBe('engine_continue')
    expect(EngineEvent.SUBROUTINE_CANCELLED).toBe('engine_subroutine_cancelled')
    expect(EngineEvent.ALL_SUBROUTINES_CANCELLED).toBe('engine_all_subroutines_cancelled')
    expect(EngineEvent.STOP_SE).toBe('stopse')
    expect(EngineEvent.STOP_BGM).toBe('stopbgm')
    expect(EngineEvent.STOP_TRANSITION).toBe('stoptrans')
    expect(EngineEvent.FADEOUT_BGM).toBe('fadeoutbgm')
    expect(EngineEvent.TRANSITION_ENDED).toBe('wt')
    expect(EngineEvent.TEXT_CLICK).toBe('text_click')
    expect(EngineEvent.CLICK).toBe('click')
    expect(EngineEvent.PAUSE_BGM).toBe('pausebgm')
    expect(EngineEvent.RESUME_BGM).toBe('resumebgm')
  })
})
