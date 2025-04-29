import type { ConsolaInstance } from 'consola'
import type { CommandStorage } from '../types/CommandStorage'
import type { Game } from '../types/Game'
import type { KirikiriEngineOptions } from '../types/KirikiriEngineOptions'
import { createConsola } from 'consola'
import { getCommand } from '../commands/getCommand'
import { ifCommand } from '../commands/ifCommand'
import { linkCommand } from '../commands/linkCommand'
import { createMacro } from '../commands/macroCommand'
import { scriptCommand } from '../commands/scriptCommand'
import { EngineEvent, GLOBAL_SCRIPT_CONTEXT } from '../constants'
import { EngineState } from '../enums/EngineState'
import { UnknownCommandError } from '../errors/UnknownCommandError'
import { checkIsBlockCommand } from '../utils/checkIsBlockCommand'
import { extractCommand } from '../utils/extractCommand'
import { extractCommands } from '../utils/extractCommands'
import { extractStorage } from '../utils/extractStorage'
import { findClosingBlockCommandIndex } from '../utils/findClosingBlockCommandIndex'
import { findFileInTree } from '../utils/findFileInTree'
import { findSubroutineEndIndex } from '../utils/findSubroutineEndIndex'
import { isComment } from '../utils/isComment'
import { removeFileExtension } from '../utils/removeFileExtension'
import { sanitizeLine } from '../utils/sanitizeLine'
import { splitMultiCommandLine } from '../utils/splitMultiCommandLine'
import { KirikiriRenderer } from './KirikiriRenderer'

export class KirikiriEngine {
  /**
   * Canvas element where the game will be rendered.
   */
  readonly canvas: HTMLCanvasElement

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
   * Creates a new Kirikiri engine instance.
   *
   * @param params - The parameters for the engine.
   * @param params.canvas - The canvas element where the game will be rendered.
   * @param params.game - The game data.
   * @param params.options - The engine options.
   */
  constructor({ canvas, game, options }: {
    canvas: HTMLCanvasElement
    game: Game
    options?: KirikiriEngineOptions
  }) {
    this.canvas = canvas
    this.game = game

    this.options = options || {
      loglevel: 0,
    }

    this.renderer = new KirikiriRenderer(canvas)

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
    await this.renderer.init()

    await this.loadFile(this.game.entry)

    this.state = EngineState.RUNNING

    await this.runSubroutine('start')
  }

  /**
   * Load the file content with the correct encoding.
   */
  async loadFile(filename: string): Promise<string[]> {
    const response = await this.fetchFile(filename)

    const lines = await this.convertFilesToLines(response)

    this.currentData.script = removeFileExtension(filename)

    await this.loadAssets(lines)

    await this.registerAllSubroutines(lines)

    return lines
  }

  private async loadAssets(lines: string[]) {
    const filesToLoad = new Set<string>()

    lines.forEach((line) => {
      const storage = extractStorage(line)

      if (storage) {
        if (storage.endsWith('.ks')) {
          return
        }

        try {
          const path = this.getFullFilePath(storage)

          filesToLoad.add(path)
        }
        catch {
          this.logger.error(`Failed to load file: ${storage}`)
        }
      }
    })

    await this.renderer.loadAssets(Array.from(filesToLoad))
  }

  private async convertFilesToLines(response: Response) {
    const arrayBuffer = await response.arrayBuffer()

    const text = new TextDecoder('shift-jis').decode(arrayBuffer)

    const lines = this.splitAndSanitize(text)

    return lines
  }

  private async fetchFile(filename: string) {
    const foundFile = findFileInTree(filename, this.game.files)

    if (!foundFile) {
      throw new Error(`File ${filename} not found`)
    }

    const url = new URL(foundFile, this.game.root.endsWith('/') ? this.game.root : `${this.game.root}/`)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`)
    }

    return response
  }

  getFullFilePath(filename: string) {
    const foundFile = findFileInTree(filename, this.game.files)

    if (!foundFile) {
      throw new Error(`File ${filename} not found`)
    }

    return `${this.game.root}/${foundFile}`
  }

  /**
   * Split the content into lines and sanitize them. Removes all comments.
   */
  splitAndSanitize(content: string) {
    return content
      .split('\n')
      .filter(Boolean)
      .filter(line => !isComment(line))
      .map(line => sanitizeLine(line))
      .map(line => splitMultiCommandLine(line))
      .flat()
  }

  /**
   * Scans the lines for subroutines and registers them.
   *
   * @param lines - The lines to scan.
   */
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

        const subroutineLines = lines.slice(index + 1, closingIndex)

        this.subroutines[this.currentData.script][subroutineName] = subroutineLines
      }

      index += 1
    } while (index < lines.length)
  }

  /**
   * Handles the paused state of the engine.
   *
   * If the engine is paused, it will wait for the CONTINUE event to be dispatched.
   * This allows the engine to pause execution and wait for user input or other events.
   */
  private async handlePausedState(): Promise<void> {
    if (this.state === EngineState.PAUSED) {
      await new Promise<void>((resolve) => {
        window.addEventListener(EngineEvent.CONTINUE, () => resolve())
      })
    }
  }

  private async processLine(line: string, index: number, lines: string[]): Promise<number> {
    const firstCharacter = line.charAt(0)
    this.currentData.line = line

    switch (firstCharacter) {
      case '*':
        return index + 1

      case '@':
      case '[':
        this.logger.debug(`Processing line ${index + 1}: ${line}`)
        return await this.processCommand(line, index, lines)

      default:
        await this.processText(line)
        return index + 1
    }
  }

  /**
   * Processes a command line.
   *
   * @param line - The command line to process.
   * @param index - The current line index.
   * @param lines - The list of all lines.
   */
  private async processCommand(line: string, index: number, lines: string[]): Promise<number> {
    const { command, props } = extractCommand(line)

    this.updateCommandCallCount(command)

    try {
      const macro = this.macros[command]
      if (macro) {
        await macro(props)
        return index + 1
      }

      const blockCommand = checkIsBlockCommand(command)
      if (blockCommand) {
        const nextIndex = await this.processBlockCommand(command, index, lines, props)
        return nextIndex
      }

      const basicCommand = getCommand(command)
      await basicCommand(this, props)
      return index + 1
    }
    catch (error) {
      if (error instanceof UnknownCommandError) {
        this.logger.warn(`Unknown command: ${command} at line ${index + 1}`)
      }
      else {
        this.logger.error(`Error processing command: ${command} at line ${index + 1}`, error)
      }

      return index + 1
    }
  }

  /**
   * Processes a block command.
   *
   * @param command - The block command to process.
   * @param index - The current line index.
   * @param lines - The list of all lines.
   * @param props - The properties of the command.
   */
  private async processBlockCommand(command: string, index: number, lines: string[], props: Record<string, string>): Promise<number> {
    const closingIndex = findClosingBlockCommandIndex(command, index, lines)

    const blockLines = lines.slice(index + 1, closingIndex)

    switch (command) {
      case 'macro': {
        const { macro, name } = createMacro(this, { ...props, lines: blockLines })
        this.macros[name] = macro
        break
      }
      case 'iscript':
        await scriptCommand(this, blockLines, props)
        break
      case 'link': {
        await linkCommand(this, blockLines, props)
        break
      }
      case 'if':
        await ifCommand(this, { ...props, lines: blockLines })
        break
    }

    return closingIndex + 1
  }

  /**
   * Runs the specified lines of code.
   */
  async runLines(lines: string[]): Promise<void> {
    let index = 0

    do {
      await this.handlePausedState()

      if (this.state === EngineState.CANCEL_SUBROUTINE) {
        this.state = EngineState.RUNNING
        window.dispatchEvent(new CustomEvent(EngineEvent.SUBROUTINE_CANCELLED))
        return
      }

      if (this.state === EngineState.CANCEL_ALL_SUBROUTINES) {
        if (this.subroutineCallStack.length === 1) {
          this.state = EngineState.RUNNING
          window.dispatchEvent(new CustomEvent(EngineEvent.ALL_SUBROUTINES_CANCELLED))
        }
        else {
          this.logger.info(`Cancelled subroutine ${this.subroutineCallStack[this.subroutineCallStack.length - 1]}`)
        }
        return
      }

      const line = lines[index]

      try {
        index = await this.processLine(line, index, lines)
      }
      catch (error) {
        this.logger.error(`Error processing line ${index + 1}: ${line}`, error)
        index += 1
      }
    } while (index < lines.length)
  }

  /**
   * Add a character to the visible text on the screen.
   */
  async addCharacter(character: string, options?: {
    skip?: boolean
  }) {
    const renderSpeed = 40

    return new Promise<void>((resolve) => {
      this.renderer.addCharacterToText(character, this.commandStorage.indent?.enabled)

      setTimeout(() => {
        resolve()
      }, options?.skip ? 0 : renderSpeed)
    })
  }

  /**
   * Process text.
   */
  async processText(text: string) {
    let skip = false

    const onClick = () => {
      skip = true
    }

    if (this.commandStorage.clickskip?.enabled) {
      window.addEventListener('click', () => {
        onClick()
      }, { once: true })
    }

    let index = 0
    while (index < text.length) {
      const character = text.charAt(index)

      const { length, commands } = extractCommands(text.slice(index))

      if (commands.length) {
        for (const { command, props } of commands) {
          try {
            switch (command) {
              case 'indent': {
                this.commandStorage.indent = {
                  enabled: true,
                }
                break
              }
              case 'endindent': {
                this.commandStorage.indent = {
                  enabled: false,
                }
                break
              }
              case 'r': {
                await this.addCharacter('\n', { skip })
                break
              }
              default: {
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
                    this.logger.warn(`Unknown command: ${command} at line ${index + 1}`)
                  }
                }
              }
            }
          }
          catch {
            this.logger.error(`Error processing command: ${command} at line ${index + 1}`)
          }
        }

        index += length

        continue
      }

      await this.addCharacter(character, { skip })

      index += 1
    }

    if (this.commandStorage.clickskip?.enabled) {
      window.removeEventListener('click', onClick)
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
      await this.cancelAllSubroutines()
    }

    this.currentData.subroutine = subroutineName

    this.currentData.subroutine = subroutineName
    this.subroutineCallStack.push(subroutineName)
    this.logger.debug(`Running subroutine ${subroutineName}. Callstack: ${this.subroutineCallStack.join(' > ')}`)
    await this.runLines(subroutine)
    this.subroutineCallStack.pop()
    this.currentData.subroutine = this.subroutineCallStack[this.subroutineCallStack.length - 1] || null
    this.logger.debug(`Finished subroutine ${subroutineName}. Callstack: ${this.subroutineCallStack.join(' > ')}`)
  }

  /**
   * Sends the command to cancel all running subroutines.
   */
  private async cancelAllSubroutines() {
    return new Promise<void>((resolve) => {
      window.addEventListener(EngineEvent.ALL_SUBROUTINES_CANCELLED, async () => {
        this.logger.info(`Cancelled subroutine ${this.currentData.subroutine}`)
        resolve()
      }, { once: true })

      window.dispatchEvent(new CustomEvent(EngineEvent.STOP_SE))
      window.dispatchEvent(new CustomEvent(EngineEvent.STOP_BGM))

      this.state = EngineState.CANCEL_ALL_SUBROUTINES
    })
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
