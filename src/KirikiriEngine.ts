import type { ConsolaInstance } from 'consola'
import type { State } from './enums/State'
import type { Game } from './types/Game'
import type { KirikiriEngineOptions } from './types/KirikiriEngineOptions'
import { createConsola } from 'consola'
import Konva from 'konva'
import { ZodError } from 'zod'
import { createButtonCommand } from './commands/createButtonCommand'
import { createCallCommand } from './commands/createCallCommand'
import { createChangeLayerCountCommand } from './commands/createChangeLayerCountCommand'
import { createCharacterPositionCommand } from './commands/createCharacterPositionCommand'
import { createClearMessageCommand } from './commands/createClearMessageCommand'
import { createClearTextCommand } from './commands/createClearTextCommand'
import { createCopyFrontToBackLayerCommand } from './commands/createCopyFrontToBackLayerCommand'
import { createDelayCommand } from './commands/createDelayCommand'
import { createEmbeddedTagCommand } from './commands/createEmbeddedTagCommand'
import { createEvalCommand } from './commands/createEvalCommand'
import { createHistoryCommand } from './commands/createHistoryCommand'
import { createImageCommand } from './commands/createImageCommand'
import { createJumpCommand } from './commands/createJumpCommand'
import { createLayerMoveCommand } from './commands/createLayerMoveCommand'
import { createLayerOptionCommand } from './commands/createLayerOptionCommand'
import { createLoadPluginCommand } from './commands/createLoadPluginCommand'
import { createMacro } from './commands/createMacro'
import { createPlaySoundEffectCommand } from './commands/createPlaySoundEffectCommand'
import { createPositionCommand } from './commands/createPositionCommand'
import { createReleaseLayerImageCommand } from './commands/createReleaseLayerImageCommand'
import { createResetWaitCommand } from './commands/createResetWaitCommand'
import { createScenarioExitCommand } from './commands/createScenarioExitCommand'
import { createStopSoundEffectCommand } from './commands/createStopSoundEffectCommand'
import { createStyleCommand } from './commands/createStyleCommand'
import { createTextWaitForClickCommand } from './commands/createTextWaitForClickCommand'
import { createTransitionCommand } from './commands/createTransitionCommand'
import { createWaitClickCommand } from './commands/createWaitClickCommand'
import { createWaitCommand } from './commands/createWaitCommand'
import { createWaitForMovementCommand } from './commands/createWaitForMovementCommand'
import { createWaitForSoundEffectCommand } from './commands/createWaitForSoundEffectCommand'
import { createWaitTransitionCommand } from './commands/createWaitTransitionCommand'
import { UnknownCommandError } from './errors/UnknownCommandError'
import { checkIsBlockCommand } from './utils/checkIsBlockCommand'
import { extractCommand } from './utils/extractCommand'
import { findClosingBlockCommandIndex } from './utils/findClosingBlockCommandIndex'
import { findFileInTree } from './utils/findFileInTree'
import { getPlacholders } from './utils/getPlaceholders'
import { isComment } from './utils/isComment'
import { sanitizeLine } from './utils/sanitizeLine'
import { splitMultiCommandLine } from './utils/splitMultiCommandLine'

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
   * Konva stage instance where everything is drawn.
   */
  readonly stage: Konva.Stage

  /**
   * Logger instance.
   */
  readonly logger: ConsolaInstance

  /**
   * List of files that are not processed yet but were found during processing of a script.
   */
  private readonly unprocessedFiles: string[] = []

  /**
   * List of files that were processed.
   */
  private readonly processdFiles: Record<string, unknown> = {}

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
   * Transition
   */
  private states: State[] = []

  /**
   * Counts how often a command was called.
   */
  readonly commandCallCount: Record<string, number> = {}

  /**
   * All available macros.
   */
  readonly macros: Record<string, (props: Record<string, string>) => Promise<void>> = {}

  /**
   * Layers
   */
  readonly layers: {
    background: Konva.Layer
    foreground: Konva.Layer
    message: Konva.Layer
  }

  /**
   * Last image properties.
   */
  lastImageProps: Array<{
    layer: 'base' | number
    page: 'back' | 'fore'
  }> = []

  constructor({ container, game, options }: {
    container: HTMLDivElement
    game: Game
    options?: KirikiriEngineOptions
  }) {
    this.game = game

    this.options = options || {
      loglevel: 0,
    }

    this.stage = new Konva.Stage({
      container,
      width: container.offsetWidth,
      height: container.offsetHeight,
    })

    const background = new Konva.Layer({
      name: 'background',
    })

    this.stage.add(background)

    const foreground = new Konva.Layer({
      name: 'foreground',
    })

    this.stage.add(foreground)

    const message = new Konva.Layer({
      name: 'message',
    })

    this.layers = {
      background,
      foreground,
      message,
    }

    this.logger = createConsola({
      fancy: true,
      level: this.options.loglevel,
      formatOptions: {
        colors: true,
        date: true,
      },
    })

    const initialWidth = container.offsetWidth
    const initialHeight = container.offsetHeight

    window.addEventListener('resize', () => {
      container.style.width = '100%'

      const containerWidth = container.offsetWidth

      const scale = containerWidth / initialWidth

      this.stage.width(initialWidth * scale)
      this.stage.height(initialHeight * scale)
      this.stage.scale({ x: scale, y: scale })
    })
  }

  async run() {
    const content = await this.loadFile(this.game.entry)
    const lines = this.splitAndSanitize(content)

    await this.processLines(lines)

    this.printCommandCallCount()
  }

  /**
   * Load the file content with the correct encoding.
   */
  async loadFile(filename: string) {
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

    return text
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

  /**
   * Process lines of the script.
   */
  async processLines(lines: string[]) {
    const processedLines: {
      jumpPoints: Array<{ name: string, index: number }>
      commands: Array<
        (props: Record<string, string>) => Promise<void>
      >
      placeholders: Record<number, Record<string, string>>
    } = {
      jumpPoints: [],
      commands: [],
      placeholders: {},
    }

    let index = 0

    do {
      const line = lines[index]

      const firstCharacter = line.charAt(0)

      try {
        switch (firstCharacter) {
          case '*': {
            const match = line.match(/^\*(.+)/)

            if (!match) {
              throw new Error(`Invalid jump point line: ${line}`)
            }

            processedLines.jumpPoints.push({
              name: match[1],
              index,
            })
            index += 1
            break
          }

          case '[': {
            const { command, props } = extractCommand(line)

            this.updateCommandCallCount(command)

            if (this.macros[command]) {
              const macro = this.macros[command]

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
                  const { macro, name } = await createMacro(this, {
                    ...props,
                    lines: blockLines,
                  })

                  this.macros[name] = macro

                  break
                }
                case 'link': {
                  // todo
                  break
                }
                case 'if': {
                  // todo
                  break
                }
              }

              index = closingIndex + 1
              break
            }
            else {
              try {
                const commandFunction = this.create(command, props, this)
                processedLines.commands.push(commandFunction)

                const placeholders = getPlacholders(line)

                processedLines.placeholders[index] = placeholders
              }
              catch (error) {
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

          case '@': {
            index += 1
            break
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

        index += 1
      }
    } while (index < lines.length)

    return processedLines
  }

  /**
   * Adds a command to the call count or increments it if it already exists.
   */
  private updateCommandCallCount(command: string) {
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

  private create(command: string, props: Record<string, string>, engine: KirikiriEngine): (props?: Record<string, string>) => Promise<void> {
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
  }
}
