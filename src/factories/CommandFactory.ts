import type { KirikiriEngine } from '../KirikiriEngine'
import { createButtonCommand } from '../commands/createButtonCommand'
import { createCallCommand } from '../commands/createCallCommand'
import { createChangeLayerCountCommand } from '../commands/createChangeLayerCountCommand'
import { createCharacterPositionCommand } from '../commands/createCharacterPositionCommand'
import { createClearMessageCommand } from '../commands/createClearMessageCommand'
import { createClearTextCommand } from '../commands/createClearTextCommand'
import { createCopyFrontToBackLayerCommand } from '../commands/createCopyFrontToBackLayerCommand'
import { createDelayCommand } from '../commands/createDelayCommand'
import { createEmbeddedTagCommand } from '../commands/createEmbeddedTagCommand'
import { createEvalCommand } from '../commands/createEvalCommand'
import { createHistoryCommand } from '../commands/createHistoryCommand'
import { createImageCommand } from '../commands/createImageCommand'
import { createJumpCommand } from '../commands/createJumpCommand'
import { createLayerMoveCommand } from '../commands/createLayerMoveCommand'
import { createLayerOptionCommand } from '../commands/createLayerOptionCommand'
import { createLoadPluginCommand } from '../commands/createLoadPluginCommand'
import { createPlaySoundEffectCommand } from '../commands/createPlaySoundEffectCommand'
import { createPositionCommand } from '../commands/createPositionCommand'
import { createReleaseLayerImageCommand } from '../commands/createReleaseLayerImageCommand'
import { createResetWaitCommand } from '../commands/createResetWaitCommand'
import { createScenarioExitCommand } from '../commands/createScenarioExitCommand'
import { createStopSoundEffectCommand } from '../commands/createStopSoundEffectCommand'
import { createStyleCommand } from '../commands/createStyleCommand'
import { createTextWaitForClickCommand } from '../commands/createTextWaitForClickCommand'
import { createTransitionCommand } from '../commands/createTransitionCommand'
import { createWaitClickCommand } from '../commands/createWaitClickCommand'
import { createWaitCommand } from '../commands/createWaitCommand'
import { createWaitForMovementCommand } from '../commands/createWaitForMovementCommand'
import { createWaitForSoundEffectCommand } from '../commands/createWaitForSoundEffectCommand'
import { createWaitTransitionCommand } from '../commands/createWaitTransitionCommand'
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
      case 'eval': {
        return createEvalCommand(engine, props)
      }
      case 'wt': {
        return createWaitTransitionCommand(engine, props)
      }
      case 'position': {
        return createPositionCommand(engine, props)
      }
      case 'resetwait': {
        return createResetWaitCommand(engine, props)
      }
      case 'ct': {
        return createClearTextCommand(engine, props)
      }
      case 'stopse': {
        return createStopSoundEffectCommand(engine, props)
      }
      case 'style': {
        return createStyleCommand(engine, props)
      }
      case 'waitclick': {
        return createWaitClickCommand(engine, props)
      }
      case 'delay': {
        return createDelayCommand(engine, props)
      }
      case 'jump': {
        return createJumpCommand(engine, props)
      }
      case 'trans': {
        return createTransitionCommand(engine, props)
      }
      case 'ws': {
        return createWaitForSoundEffectCommand(engine, props)
      }
      case 'layopt': {
        return createLayerOptionCommand(engine, props)
      }
      case 'move': {
        return createLayerMoveCommand(engine, props)
      }
      case 'wm': {
        return createWaitForMovementCommand(engine, props)
      }
      case 'backlay': {
        return createCopyFrontToBackLayerCommand(engine, props)
      }
      case 'playse': {
        return createPlaySoundEffectCommand(engine, props)
      }
      case 'button': {
        return createButtonCommand(engine, props)
      }
      case 'emb': {
        return createEmbeddedTagCommand(engine, props)
      }
      case 'fgzoom': {
        // TODO: find out what this does
        return async () => { }
      }
      case 'wfgzoom': {
        // TODO: find out what this does
        return async () => { }
      }
      case 'cm': {
        return createClearMessageCommand(engine, props)
      }
      case 'laycount': {
        return createChangeLayerCountCommand(engine, props)
      }
      case 'locate': {
        return createCharacterPositionCommand(engine, props)
      }
      case 'freeimage': {
        return createReleaseLayerImageCommand(engine, props)
      }
    }

    throw new UnknownCommandError(command)
  },
}
