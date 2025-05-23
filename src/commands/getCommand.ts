import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { UnknownCommandError } from '../errors/UnknownCommandError'
import { buttonCommand } from './buttonCommand'
import { callCommand } from './callCommand'
import { changeLayerCountCommand } from './changeLayerCountCommand'
import { clearMessageCommand } from './clearMessageCommand'
import { clearTextCommand } from './clearTextCommand'
import { clickSkipCommand } from './clickSkipCommand'
import { copyFrontToBackLayerCommand } from './copyFrontToBackLayerCommand'
import { delayCommand } from './delayCommand'
import { deleteMessageLayerChildrenCommand } from './deleteMessageLayerChildrenCommand'
import { embeddedTagCommand } from './embeddedTagCommand'
import { evalCommand } from './evalCommand'
import { fadeOutBackgroundMusicCommand } from './fadeOutBackgroundMusic'
import { fontCommand } from './fontCommand'
import { historyCommand } from './historyCommand'
import { imageCommand } from './imageCommand'
import { jumpCommand } from './jumpCommand'
import { layerOptionCommand } from './layerOptionCommand'
import { loadPluginCommand } from './loadPluginCommand'
import { moveCommand } from './moveCommand'
import { pauseBackgroundMusicCommand } from './pauseBackgroundMusicCommand'
import { playBackgroundMusicCommand } from './playBackgroundMusicCommand'
import { playSoundEffectCommand } from './playSoundEffectCommand'
import { playVideoCommand } from './playVideoCommand'
import { positionCommand } from './positionCommand'
import { quakeCommand } from './quakeCommand'
import { releaseLayerImageCommand } from './releaseLayerImageCommand'
import { resetWaitCommand } from './resetWaitCommand'
import { resumeBackgroundMusicCommand } from './resumeBackgroundMusicCommand'
import { rightClickCommand } from './rightClickCommand'
import { scenarioExitCommand } from './scenarioExitCommand'
import { startanchorCommand } from './startanchorCommand'
import { stopBackgroundMusicCommand } from './stopBackgroundMusicCommand'
import { stopSoundEffectCommand } from './stopSoundEffectCommand'
import { stopTransitionCommand } from './stopTransitionCommand'
import { storePositionCommand } from './storePositionCommand'
import { styleCommand } from './styleCommand'
import { transitionCommand } from './transitionCommand'
import { videoCommand } from './videoCommand'
import { waitCommand } from './waitCommand'
import { waitForBackgroundMusicCommand } from './waitForBackgroundMusicCommand'
import { waitForClickAndInsertLineBreakCommand } from './waitForClickAndInsertLineBreakCommand'
import { waitForClickCommand } from './waitForClickCommand'
import { waitForMoveCommand } from './waitForMoveCommand'
import { waitForSoundEffectCommand } from './waitForSoundEffectCommand'
import { waitForTextClickWithPageBreakCommand } from './waitForTextClickWithPageBreakCommand'
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
  l: waitForClickAndInsertLineBreakCommand,
  p: waitForTextClickWithPageBreakCommand,
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
  locate: storePositionCommand,
  laycount: changeLayerCountCommand,
  call: callCommand,
  loadplugin: loadPluginCommand,
  fgzoom: async () => { /* TODO: find out what this does */ },
  wfgzoom: async () => { /* TODO: find out what this does */ },
  fadeinbgm: playBackgroundMusicCommand,
  playbgm: playBackgroundMusicCommand,
  rclick: rightClickCommand,
  wl: waitForBackgroundMusicCommand,
  stopbgm: stopBackgroundMusicCommand,
  wm: waitForMoveCommand,
  fadeoutbgm: fadeOutBackgroundMusicCommand,
  video: videoCommand,
  playvideo: playVideoCommand,
  er: deleteMessageLayerChildrenCommand,
  stoptrans: stopTransitionCommand,
  startanchor: startanchorCommand,
  font: fontCommand,
  pausebgm: pauseBackgroundMusicCommand,
  resumebgm: resumeBackgroundMusicCommand,
  quake: quakeCommand,
  clickskip: clickSkipCommand,
}

export function getCommand(command: string): (engine: KirikiriEngine, props?: Record<string, string>) => Promise<void> {
  if (commandMap[command]) {
    return commandMap[command]
  }

  throw new UnknownCommandError(command)
}
