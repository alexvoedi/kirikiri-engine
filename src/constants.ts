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
  saveRegistry: () => null,
}
