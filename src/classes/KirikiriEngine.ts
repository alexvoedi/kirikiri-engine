import type { ConsolaInstance } from 'consola'
import type { CommandStorage } from '../types/CommandStorage'
import type { Game } from '../types/Game'
import type { KirikiriEngineOptions } from '../types/KirikiriEngineOptions'
import { createConsola } from 'consola'
import { ZodError } from 'zod'
import { getCommand } from '../commands/getCommand'
import { ifCommand } from '../commands/ifCommand'
import { createMacro } from '../commands/macroCommand'
import { scriptCommand } from '../commands/scriptCommand'
import { COMMAND_BLOCKS, EngineEvent, GLOBAL_SCRIPT_CONTEXT } from '../constants'
import { EngineState } from '../enums/EngineState'
import { UnknownCommandError } from '../errors/UnknownCommandError'
import { checkIsBlockCommand } from '../utils/checkIsBlockCommand'
import { extractCommand } from '../utils/extractCommand'
import { findClosingBlockCommandIndex } from '../utils/findClosingBlockCommandIndex'
import { findFileInTree } from '../utils/findFileInTree'
import { findSubroutineEndIndex } from '../utils/findSubroutineEndIndex'
import { isComment } from '../utils/isComment'
import { removeCommandsFromText } from '../utils/removeCommandsFromText'
import { removeFileExtension } from '../utils/removeFileExtension'
import { sanitizeLine } from '../utils/sanitizeLine'
import { splitMultiCommandLine } from '../utils/splitMultiCommandLine'
import { KirikiriRenderer } from './KirikiriRenderer'

export class KirikiriEngine {
  /**
   * Container element where the game will be rendered.
   */
  readonly container: HTMLDivElement

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
   * Counts how often a command was called.
   */
  readonly commandCallCount: Record<string, number> = {}

  /**
   * All available macros.
   */
  readonly macros: Record<string, (props: Record<string, string>) => Promise<void>> = {}

  /**
   * All available subroutines grouped by script.
   */
  readonly subroutines: Record<string, Record<string, string[]>> = {}

  /**
   * Current script
   */
  currentData: {
    script: string | null
    subroutine: string | null
    line: string | null
  } = {
      script: null,
      subroutine: null,
      line: null,
    }

  /**
   * Subroutine call stack
   */
  readonly subroutineCallStack: string[] = []

  /**
   * State
   */
  private state: EngineState = EngineState.UNINITIALIZED

  /**
   * Global script context.
   */
  readonly globalScriptContext = GLOBAL_SCRIPT_CONTEXT

  /**
   * State storage.
   */
  readonly commandStorage: CommandStorage = {
    delay: {
      speed: 20,
    },
  }

  /**
   * Message
   */
  readonly text: string = ''

  constructor({ container, game, options }: {
    container: HTMLDivElement
    game: Game
    options?: KirikiriEngineOptions
  }) {
    this.container = container
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

    this.state = EngineState.INITIALIZED
  }

  async run() {
    this.renderer.init()

    const lines = await this.loadFile(this.game.entry)

    this.state = EngineState.RUNNING

    await this.runLines(lines)

    // this.printCommandCallCount()
  }

  /**
   * Load the file content with the correct encoding.
   */
  async loadFile(filename: string): Promise<string[]> {
    const foundFiles = findFileInTree(filename, this.game.files)

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

    this.currentData.script = removeFileExtension(filename)

    await this.registerAllSubroutines(lines)

    return lines
  }

  getFullFilePath(filename: string) {
    const foundFiles = findFileInTree(filename, this.game.files)

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
    if (!this.currentData.script) {
      throw new Error(`No current script set`)
    }

    this.subroutines[this.currentData.script] = {}

    let index = 0

    do {
      const line = lines[index]

      const firstCharacter = line.charAt(0)

      if (firstCharacter === '*') {
        const closingIndex = findSubroutineEndIndex(index, lines)

        if (closingIndex === -1) {
          throw new Error(`Could not find end of subroutine for ${line} at line ${index + 1}`)
        }

        const match = /^\*(.+)/.exec(line) // find the name of the subroutine

        if (!match) {
          throw new Error(`Invalid jump point line: ${line}`)
        }

        const subroutineName = match[1].trim()

        // Get the lines of the subroutine
        const subroutineLines = lines.slice(index + 1, closingIndex)

        this.subroutines[this.currentData.script][subroutineName] = subroutineLines

        // this.logger.info('Registered new subroutine:', subroutineName)
      }

      index += 1
    } while (index < lines.length)
  }

  /**
   * Execute the lines.
   */
  async runLines(lines: string[], index = 0): Promise<void> {
    do {
      if (this.state === EngineState.PAUSED) {
        await new Promise<void>((resolve) => {
          window.addEventListener(EngineEvent.CONTINUE, () => {
            resolve()
          })
        })
      }

      if (this.state === EngineState.CANCEL_SUBROUTINE) {
        if (this.subroutineCallStack.length === 0) {
          this.state = EngineState.RUNNING
          window.dispatchEvent(new CustomEvent(EngineEvent.SUBROUTINE_CANCELLED))
        }
        else {
          this.logger.info(`Cancelled subroutine ${this.subroutineCallStack[this.subroutineCallStack.length - 1]}`)
        }

        return
      }

      const line = lines[index]

      const firstCharacter = line.charAt(0)

      try {
        this.currentData.line = line

        switch (firstCharacter) {
          case '*': {
            const subroutineName = line.slice(1).trim()

            await this.runSubroutine(subroutineName)

            index += 1

            break
          }

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
                const commandFunction = getCommand(command)

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
            await this.processText(line)

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

  async renderText(text: string) {
    const renderSpeed = 40

    return new Promise<void>((resolve) => {
      this.renderer.setText(text)

      setTimeout(() => {
        resolve()
      }, renderSpeed)
    })
  }

  /**
   * Process text.
   */
  async processText(text: string) {
    const { commands, text: textWithoutCommands } = removeCommandsFromText(text)

    for (let i = 0; i < textWithoutCommands.length + 1; i++) {
      const currentText = textWithoutCommands.slice(0, i)

      await this.renderText(currentText)

      if (commands[i]) {
        for (const c of commands[i]) {
          const { command, props } = c

          try {
            const macro = this.macros[command]
            if (macro) {
              await macro(props)
            }
            else {
              const commandFunction = getCommand(command)

              if (commandFunction) {
                await commandFunction(this, props)
              }
              else {
                this.logger.warn(`Unknown command: ${command} at line ${i + 1}`)
              }
            }

            this.updateCommandCallCount(command)
          }
          catch {
            // this.logger.error(`Error processing command: ${command} at line ${i + 1}`)
          }
        }
      }
    }
  }

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
   * Runs the specified subroutine. If `force` is true, it will cancel the current subroutine.
   */
  async runSubroutine(subroutineName: string, options?: {
    file?: string
    force?: boolean
  }) {
    if (options?.file) {
      const lines = await this.loadFile(options.file)
      await this.registerAllSubroutines(lines)
    }

    if (!this.currentData.script) {
      throw new Error(`No current script set`)
    }

    const subroutine = this.subroutines[this.currentData.script][subroutineName]

    if (!subroutine) {
      this.logger.warn(`Subroutine ${subroutineName} not found`)
      return
    }

    if (this.currentData.subroutine && options?.force) {
      await new Promise<void>((resolve) => {
        const onCancelled = () => {
          this.logger.info(`Cancelled subroutine ${this.currentData.subroutine}`)
          window.removeEventListener(EngineEvent.SUBROUTINE_CANCELLED, onCancelled)
          resolve()
        }

        window.addEventListener(EngineEvent.SUBROUTINE_CANCELLED, onCancelled)

        window.dispatchEvent(new CustomEvent(EngineEvent.STOP_SE))
        window.dispatchEvent(new CustomEvent(EngineEvent.STOP_BGM))

        this.state = EngineState.CANCEL_SUBROUTINE
      })
    }

    this.currentData.subroutine = subroutineName

    this.logger.info(`Running subroutine ${subroutineName}`)

    this.currentData.subroutine = subroutineName
    this.subroutineCallStack.push(subroutineName)
    await this.runLines(subroutine)
    this.subroutineCallStack.pop()
    this.currentData.subroutine = this.subroutineCallStack[this.subroutineCallStack.length - 1] || null
  }

  getState() {
    return this.state
  }

  setState(state: EngineState) {
    this.state = state

    if (state === EngineState.RUNNING) {
      window.dispatchEvent(new CustomEvent(EngineEvent.CONTINUE))
    }

    this.logger.debug(`Engine state changed to: ${state}`)
  }
}
