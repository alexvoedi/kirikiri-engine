export const COMMAND_BLOCKS: Record<string, string> = {
  iscript: 'endscript',
  macro: 'endmacro',
  if: 'endif',
  link: 'endlink',
  indent: 'endindent',
}

// The game ready this value from the registry. Initially it must be != 55 to avoid a timeout. After it was read once it must be 55 because that is the required value to start the game.
let REGISTY_VALUE = 54

export const GLOBALS = {
  System: {
    shellExecute: () => null,
    exePath: undefined,
    inform: () => null,
    exit: () => null,
    readRegValue: () => REGISTY_VALUE++,
  },
  Storages: {
    getLocalName: () => null,
  },
  Plugins: {
    link: () => null,
  },
  WaveSoundBuffer: {
    freeDirectSound: () => null,
  },
  saveRegistry: () => null,
}

export const GLOBAL_SCRIPT_CONTEXT = {
  kag: {
    bgm: {
      buf1: {
        volume2: null,
      },
      currentBuffer: {
        status: null,
      },
    },
    keyDownHook: {
      add: () => null,
      remove: () => null,
    },
    stopAllTransitions: () => null,
    clickCount: 0,
  },
  sf: {
    firstclear: 0,
  },
  f: {
    testmode: 0,
    cgPage: null,
  },
}

export const EngineEvent = {
  CONTINUE: 'engine_continue',
  SUBROUTINE_CANCELLED: 'engine_subroutine_cancelled',
  ALL_SUBROUTINES_CANCELLED: 'engine_all_subroutines_cancelled',
  STOP_SE: 'stopse',
  STOP_BGM: 'stopbgm',
  STOP_TRANSITION: 'stoptrans',
  FADEOUT_BGM: 'fadeoutbgm',
  TRANSITION_ENDED: 'wt',
  TEXT_CLICK: 'text_click',
  CLICK: 'click',
  PAUSE_BGM: 'pausebgm',
  RESUME_BGM: 'resumebgm',
}
