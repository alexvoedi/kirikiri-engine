import type { ConsolaInstance } from 'consola'
import type { State } from '../enums/State'
import type { Game } from '../types/Game'
import type { KirikiriEngineOptions } from '../types/KirikiriEngineOptions'
import { createConsola } from 'consola'
import { ZodError } from 'zod'
import { buttonCommand } from '../commands/buttonCommand'
import { callCommand } from '../commands/callCommand'
import { changeLayerCountCommand } from '../commands/changeLayerCountCommand'
import { characterPositionCommand } from '../commands/characterPositionCommand'
import { clearMessageCommand } from '../commands/clearMessageCommand'
import { clearTextCommand } from '../commands/clearTextCommand'
import { copyFrontToBackLayerCommand } from '../commands/copyFrontToBackLayerCommand'
import { delayCommand } from '../commands/delayCommand'
import { embeddedTagCommand } from '../commands/embeddedTagCommand'
import { evalCommand } from '../commands/evalCommand'
import { fadeBackgroundMusicInCommand } from '../commands/fadeBackgroundMusicInCommand'
import { historyCommand } from '../commands/historyCommand'
import { ifCommand } from '../commands/ifCommand'
import { imageCommand } from '../commands/imageCommand'
import { jumpCommand } from '../commands/jumpCommand'
import { layerOptionCommand } from '../commands/layerOptionCommand'
import { loadPluginCommand } from '../commands/loadPluginCommand'
import { createMacro } from '../commands/macroCommand'
import { moveCommand } from '../commands/moveCommand'
import { playSoundEffectCommand } from '../commands/playSoundEffectCommand'
import { positionCommand } from '../commands/positionCommand'
import { releaseLayerImageCommand } from '../commands/releaseLayerImageCommand'
import { resetWaitCommand } from '../commands/resetWaitCommand'
import { scenarioExitCommand } from '../commands/scenarioExitCommand'
import { scriptCommand } from '../commands/scriptCommand'
import { stopSoundEffectCommand } from '../commands/stopSoundEffectCommand'
import { styleCommand } from '../commands/styleCommand'
import { transitionCommand } from '../commands/transitionCommand'
import { waitCommand } from '../commands/waitCommand'
import { waitForClickCommand } from '../commands/waitForClickCommand'
import { waitForMovementCommand } from '../commands/waitForMovementCommand'
import { waitForSoundEffectCommand } from '../commands/waitForSoundEffectCommand'
import { waitForTextClickCommand } from '../commands/waitForTextClickCommand'
import { waitForTransitionCommand } from '../commands/waitForTransitionCommand.1'
import { COMMAND_BLOCKS } from '../constants'
import { UnknownCommandError } from '../errors/UnknownCommandError'
import { checkIsBlockCommand } from '../utils/checkIsBlockCommand'
import { extractCommand } from '../utils/extractCommand'
import { findClosingBlockCommandIndex } from '../utils/findClosingBlockCommandIndex'
import { findFileInTree } from '../utils/findFileInTree'
import { findSubroutineEndIndex } from '../utils/findSubroutineEndIndex'
import { isComment } from '../utils/isComment'
import { sanitizeLine } from '../utils/sanitizeLine'
import { splitMultiCommandLine } from '../utils/splitMultiCommandLine'
import { KirikiriRenderer } from './KirikiriRenderer'

export class KirikiriEngine {
  /**
   * Game data.
   */
  readonly game: Game

  /**
   * Kirikiri engine options.
   */
  readonly options: KirikiriEngineOptions

  /**
   * Renderer instance.
   */
  readonly renderer: KirikiriRenderer

  /**
   * Logger instance.
   */
  readonly logger: ConsolaInstance

  /**
   * List of files that are not processed yet but were found during processing of a script.
   */
  private readonly unprocessedFiles: string[] = []

  /**
   *  History
   */
  readonly history: {
    output: boolean
    enabled: boolean
  } = {
      output: false,
      enabled: false,
    }

  /**
   * Counts how often a command was called.
   */
  readonly commandCallCount: Record<string, number> = {}

  /**
   * All available macros.
   */
  readonly macros: Record<string, (props: Record<string, string>) => Promise<void>> = {}

  /**
   * All available subroutines.
   */
  readonly subroutines: Record<string, string[]> = {}

  /**
   * Global script context.
   */
  readonly globalScriptContext = {
    kag: {
      bgm: {
        buf1: {
          volume2: undefined,
        },
      },
    },
    sf: {
      firstclear: 1,
    },
    f: {
      testmode: 0,
    },
  }

  constructor({ container, game, options }: {
    container: HTMLDivElement
    game: Game
    options?: KirikiriEngineOptions
  }) {
    this.game = game

    this.options = options || {
      loglevel: 0,
    }

    this.renderer = new KirikiriRenderer(container)

    this.logger = createConsola({
      fancy: true,
      level: this.options.loglevel,
      formatOptions: {
        colors: true,
        date: true,
      },
    })
  }

  async run() {
    this.renderer.init()

    const lines = await this.loadFile(this.game.entry)

    await this.registerAllSubroutines(lines)
    await this.runLines(lines)

    // this.printCommandCallCount()
  }

  /**
   * Load the file content with the correct encoding.
   */
  async loadFile(filename: string): Promise<string[]> {
    const foundFiles = findFileInTree(filename, this.game.files, { recursive: true })

    if (foundFiles.length === 0) {
      throw new Error(`File ${filename} not found`)
    }

    if (foundFiles.length > 1) {
      throw new Error(`File ${filename} found multiple times: ${foundFiles.join(', ')}`)
    }

    const fullPath = `/ojamajo/${foundFiles[0]}`

    const url = new URL(fullPath, this.game.root)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    const text = new TextDecoder('shift-jis').decode(arrayBuffer)

    const lines = this.splitAndSanitize(text)

    return lines
  }

  getFullFilePath(filename: string) {
    const foundFiles = findFileInTree(filename, this.game.files, { recursive: true })

    if (foundFiles.length === 0) {
      throw new Error(`File ${filename} not found`)
    }

    if (foundFiles.length > 1) {
      throw new Error(`File ${filename} found multiple times: ${foundFiles.join(', ')}`)
    }

    return `${this.game.root}/${foundFiles[0]}`
  }

  /**
   * Split the content into lines and sanitize them. Removes all comments.
   */
  splitAndSanitize(content: string) {
    const lines = content.split('\n')

    return lines
      .filter(line => !isComment(line))
      .map(line => sanitizeLine(line))
      .map(line => splitMultiCommandLine(line))
      .flat()
  }

  async registerAllSubroutines(lines: string[]) {
    let index = 0

    do {
      const line = lines[index]

      const firstCharacter = line.charAt(0)

      if (firstCharacter === '*') {
        const closingIndex = findSubroutineEndIndex(index, lines)

        if (closingIndex === -1) {
          throw new Error(`Could not find end of subroutine for ${line} at line ${index + 1}`)
        }

        const match = line.match(/^\*(.+)/) // find the name of the subroutine

        if (!match) {
          throw new Error(`Invalid jump point line: ${line}`)
        }

        const subroutineName = match[1].trim()

        // Get the lines of the subroutine
        const subroutineLines = lines.slice(index + 1, closingIndex)

        this.subroutines[subroutineName] = subroutineLines

        this.logger.info('Registered new subroutine:', subroutineName)
      }

      index += 1
    } while (index < lines.length)
  }

  /**
   * Execute the lines.
   */
  async runLines(lines: string[], index = 0): Promise<void> {
    do {
      const line = lines[index]

      const firstCharacter = line.charAt(0)

      try {
        switch (firstCharacter) {
          case '@':
          case '[': {
            const { command, props } = extractCommand(line)

            this.updateCommandCallCount(command)

            const macro = this.macros[command]
            if (macro) {
              await macro(props)

              index += 1
              break
            }

            const isBlockCommand = checkIsBlockCommand(command)
            if (isBlockCommand) {
              const closingIndex = findClosingBlockCommandIndex(command, index, lines)

              if (closingIndex === -1) {
                throw new Error(`Missing closing block command for ${command} at line ${index + 1}`)
              }

              // Get the lines between the opening and closing block command
              const blockLines = lines.slice(index + 1, closingIndex)

              switch (command) {
                case 'macro': {
                  const { macro, name } = createMacro(this, {
                    ...props,
                    lines: blockLines,
                  })

                  this.macros[name] = macro

                  break
                }
                case 'iscript': {
                  await scriptCommand(this, blockLines, props)

                  break
                }
                case 'link': {
                  // todo
                  break
                }
                case 'if': {
                  await ifCommand(this, {
                    ...props,
                    lines: blockLines,
                  })

                  break
                }
              }

              index = closingIndex + 1
              break
            }
            else {
              try {
                const commandFunction = this.getCommand(command)

                await commandFunction(this, props)
              }
              catch (error) {
                if (Object.values(COMMAND_BLOCKS).includes(command)) {
                  // ignore this
                  index += 1
                  break
                }

                if (error instanceof UnknownCommandError) {
                  this.logger.warn(`Unknown command: ${command} at line ${index + 1}`)
                }
                else {
                  this.logger.error(`Error processing command: ${command} at line ${index + 1}`, error)
                }
              }

              index += 1
              break
            }
          }

          default: {
            index += 1
            break
          }
        }
      }
      catch (error) {
        if (error instanceof ZodError) {
          error.issues.forEach((issue) => {
            if (issue.code === 'unrecognized_keys') {
              this.logger.error(line, error)
            }
          })
        }
        else {
          this.logger.error(`Error processing line ${index + 1}: ${line}`, error)
        }

        index += 1
      }
    } while (index < lines.length)
  }

  /**
   *
   */

  /**
   * Adds a command to the call count or increments it if it already exists.
   */
  updateCommandCallCount(command: string) {
    if (!this.commandCallCount[command]) {
      this.commandCallCount[command] = 0
    }

    this.commandCallCount[command] += 1
  }

  /**
   * Prints the command call count to the console.
   */
  private printCommandCallCount() {
    const sortedCommandCallCount = Object.entries(this.commandCallCount)
      .sort((a, b) => b[1] - a[1])

    this.logger.info('Command call count:')

    sortedCommandCallCount.forEach(([command, count]) => {
      this.logger.debug(`${command}: ${count}`)
    })
  }

  getCommand(command: string): (engine: KirikiriEngine, props?: Record<string, string>) => Promise<void> {
    switch (command) {
      case 'image': {
        return imageCommand
      }
      case 'position': {
        return positionCommand
      }
      case 'trans': {
        return transitionCommand
      }
      case 'wt': {
        return waitForTransitionCommand
      }
      case 'ct': {
        return clearTextCommand
      }
      case 'jump': {
        return jumpCommand
      }
      case 'eval': {
        return evalCommand
      }
      case 'wait': {
        return waitCommand
      }
      case 'playse': {
        return playSoundEffectCommand
      }
      case 'ws': {
        return waitForSoundEffectCommand
      }
      case 'l': {
        return waitForTextClickCommand
      }
      case 'move': {
        return moveCommand
      }
      case 'cm': {
        return clearMessageCommand
      }
      case 'waitclick': {
        return waitForClickCommand
      }
      case 'stopse': {
        return stopSoundEffectCommand
      }
      case 'wm': {
        return waitForMovementCommand
      }
      case 'style': {
        return styleCommand
      }
      case 'delay': {
        return delayCommand
      }
      case 'history': {
        return historyCommand
      }
      case 'button': {
        return buttonCommand
      }
      case 's': {
        return scenarioExitCommand
      }
      case 'freeimage': {
        return releaseLayerImageCommand
      }
      case 'layopt': {
        return layerOptionCommand
      }
      case 'backlay': {
        return copyFrontToBackLayerCommand
      }
      case 'resetwait': {
        return resetWaitCommand
      }
      case 'emb': {
        return embeddedTagCommand
      }
      case 'locate': {
        return characterPositionCommand
      }
      case 'laycount': {
        return changeLayerCountCommand
      }
      case 'call': {
        return callCommand
      }
      case 'loadplugin': {
        return loadPluginCommand
      }
      case 'fgzoom': {
        // TODO: find out what this does
        return async () => { }
      }
      case 'wfgzoom': {
        // TODO: find out what this does
        return async () => { }
      }
      case 'fadeinbgm': {
        return fadeBackgroundMusicInCommand
      }
    }

    throw new UnknownCommandError(command)
  }

  async runSubroutine(name: string) {
    const subroutine = this.subroutines[name]

    if (!subroutine) {
      // ignore for now
      // throw new Error(`Subroutine ${name} not found`)
      return
    }

    this.logger.info(`Running subroutine ${name}`)

    await this.runLines(subroutine)
  }
}
