import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { UnknownCommandError } from '../errors/UnknownCommandError'
import { buttonCommand } from './buttonCommand'
import { callCommand } from './callCommand'
import { changeLayerCountCommand } from './changeLayerCountCommand'
import { characterPositionCommand } from './characterPositionCommand'
import { clearMessageCommand } from './clearMessageCommand'
import { clearTextCommand } from './clearTextCommand'
import { copyFrontToBackLayerCommand } from './copyFrontToBackLayerCommand'
import { delayCommand } from './delayCommand'
import { embeddedTagCommand } from './embeddedTagCommand'
import { evalCommand } from './evalCommand'
import { fadeBackgroundMusicInCommand } from './fadeBackgroundMusicInCommand'
import { fadeOutBackgroundMusicCommand } from './fadeOutBackgroundMusic'
import { historyCommand } from './historyCommand'
import { imageCommand } from './imageCommand'
import { jumpCommand } from './jumpCommand'
import { layerOptionCommand } from './layerOptionCommand'
import { loadPluginCommand } from './loadPluginCommand'
import { moveCommand } from './moveCommand'
import { playBackgroundMusicCommand } from './playBackgroundMusicCommand'
import { playSoundEffectCommand } from './playSoundEffectCommand'
import { positionCommand } from './positionCommand'
import { releaseLayerImageCommand } from './releaseLayerImageCommand'
import { resetWaitCommand } from './resetWaitCommand'
import { rightClickCommand } from './rightClickCommand'
import { scenarioExitCommand } from './scenarioExitCommand'
import { stopBackgroundMusicCommand } from './stopBackgroundMusicCommand'
import { stopSoundEffectCommand } from './stopSoundEffectCommand'
import { styleCommand } from './styleCommand'
import { transitionCommand } from './transitionCommand'
import { waitCommand } from './waitCommand'
import { waitForBackgroundMusicCommand } from './waitForBackgroundMusicCommand'
import { waitForClickCommand } from './waitForClickCommand'
import { waitForMoveCommand } from './waitForMoveCommand'
import { waitForSoundEffectCommand } from './waitForSoundEffectCommand'
import { waitForTextClickCommand } from './waitForTextClickCommand'
import { waitForTransitionCommand } from './waitForTransitionCommand'

const commandMap: Record<string, (engine: KirikiriEngine, props?: Record<string, string>) => Promise<void>> = {
  image: imageCommand,
  position: positionCommand,
  trans: transitionCommand,
  wt: waitForTransitionCommand,
  ct: clearTextCommand,
  jump: jumpCommand,
  eval: evalCommand,
  wait: waitCommand,
  playse: playSoundEffectCommand,
  ws: waitForSoundEffectCommand,
  l: waitForTextClickCommand,
  move: moveCommand,
  cm: clearMessageCommand,
  waitclick: waitForClickCommand,
  stopse: stopSoundEffectCommand,
  style: styleCommand,
  delay: delayCommand,
  history: historyCommand,
  button: buttonCommand,
  s: scenarioExitCommand,
  freeimage: releaseLayerImageCommand,
  layopt: layerOptionCommand,
  backlay: copyFrontToBackLayerCommand,
  resetwait: resetWaitCommand,
  emb: embeddedTagCommand,
  locate: characterPositionCommand,
  laycount: changeLayerCountCommand,
  call: callCommand,
  loadplugin: loadPluginCommand,
  fgzoom: async () => { /* TODO: find out what this does */ },
  wfgzoom: async () => { /* TODO: find out what this does */ },
  fadeinbgm: fadeBackgroundMusicInCommand,
  playbgm: playBackgroundMusicCommand,
  rclick: rightClickCommand,
  wl: waitForBackgroundMusicCommand,
  stopbgm: stopBackgroundMusicCommand,
  wm: waitForMoveCommand,
  fadeoutbgm: fadeOutBackgroundMusicCommand,
}

export function getCommand(command: string): (engine: KirikiriEngine, props?: Record<string, string>) => Promise<void> {
  if (commandMap[command]) {
    return commandMap[command]
  }

  throw new UnknownCommandError(command)
}
