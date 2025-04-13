import type { KirikiriEngine } from '../KirikiriEngine'
import { createCallCommand } from '../commands/createCallCommand'
import { createHistoryCommand } from '../commands/createHistoryCommand'
import { createImageCommand } from '../commands/createImageCommand'
import { createLoadPluginCommand } from '../commands/createLoadPluginCommand'
import { createScenarioExitCommand } from '../commands/createScenarioExitCommand'
import { createTextWaitForClickCommand } from '../commands/createTextWaitForClickCommand'
import { createWaitCommand } from '../commands/createWaitCommand'
import { UnknownCommandError } from '../errors/UnknownCommandError'

export const CommandFactory = {
  create(command: string, props: Record<string, string>, engine: KirikiriEngine): (props?: Record<string, string>) => Promise<void> {
    switch (command) {
      case 'wait': {
        return createWaitCommand(engine, props)
      }
      case 'image': {
        return createImageCommand(engine, props)
      }
      case 's': {
        return createScenarioExitCommand(engine, props)
      }
      case 'l': {
        return createTextWaitForClickCommand(engine, props)
      }
      case 'call': {
        return createCallCommand(engine, props)
      }
      case 'loadplugin': {
        return createLoadPluginCommand(engine, props)
      }
      case 'history': {
        return createHistoryCommand(engine, props)
      }
    }

    throw new UnknownCommandError(command)
  },
}
