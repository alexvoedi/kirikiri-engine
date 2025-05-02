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
import { extractLabel } from '../utils/extractLabel'
import { extractStorage } from '../utils/extractStorage'
import { findClosingBlockCommandIndex } from '../utils/findClosingBlockCommandIndex'
import { findFileInTree } from '../utils/findFileInTree'
import { loadFileContent } from '../utils/loadFile'
import { removeFileExtension } from '../utils/removeFileExtension'
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
   * All available macros.
   */
  readonly macros: Record<string, (props: Record<string, string>) => Promise<void>> = {}

  /**
   * Subroutine call stack
   */
  readonly callstack: Array<{
    file: string
    lines: string[]
    index: number
  }> = []

  /**
   * Structure to store labels.
   */
  readonly labels: Record<string, Record<string, number>> = {}

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
  }

  /**
   * Initialize the engine.
   */
  async init() {
    await this.renderer.init()

    this.state = EngineState.INITIALIZED
  }

  async start() {
    if (this.state !== EngineState.INITIALIZED) {
      throw new Error('Engine is not initialized')
    }

    this.state = EngineState.RUNNING

    await this.loadFile(this.game.entry)

    await this.run()
  }

  /**
   * Start the engine at the specified entry point.
   */
  async loadFile(filename: string, label?: string) {
    const lines = await this.loadFileContent(filename)

    const file = removeFileExtension(filename)

    await this.registerLabels(file, lines)
    await this.loadAssets(lines)

    const index = label ? this.labels[file][label] : 0

    this.callstack.push({
      file,
      lines,
      index,
    })
  }

  async loadAssets(lines: string[]) {
    const filesToLoad = new Set<string>()

    let index = 0
    do {
      const line = lines[index]

      const storage = extractStorage(line)

      if (storage) {
        if (storage.endsWith('.ks')) {
          index += 1

          continue
        }

        try {
          const path = this.getFullFilePath(storage)

          filesToLoad.add(path)
        }
        catch {
          this.logger.error(`Failed to load file: ${storage}`)
        }
      }

      index += 1
    } while (index < lines.length)

    if (filesToLoad.size > 0) {
      await this.renderer.loadAssets(Array.from(filesToLoad))
    }
  }

  /**
   * Find all labels in a file and register them.
   */
  async registerLabels(file: string, lines: string[]) {
    const labels: Record<string, number> = {}

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]

      if (line.startsWith('*')) {
        const label = extractLabel(line)

        labels[label] = index
      }
    }

    this.labels[file] = labels
  }

  get currentSubroutine() {
    return this.callstack[this.callstack.length - 1]
  }

  /**
   * Load the file content with the correct encoding.
   */
  async loadFileContent(filename: string): Promise<string[]> {
    const content = await loadFileContent(filename, this.game.root, this.game.files)

    return content.split('\n')
  }

  /**
   * Given a filename, get the full path to the file.
   */
  getFullFilePath(filename: string) {
    const foundFile = findFileInTree(filename, this.game.files)

    if (!foundFile) {
      throw new Error(`File ${filename} not found`)
    }

    return `${this.game.root}/${foundFile}`
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

  private async processCurrentLine(): Promise<void> {
    const line = this.currentSubroutine.lines[this.currentSubroutine.index]

    let column = 0
    do {
      const character = line.charAt(column)

      if (
        character === ' '
        || character === '\t'
        || character === '\r'
        || character === '\n'
      ) {
        column += 1
        continue
      }

      switch (character) {
        case '\\':
        case ';':
        case '*': {
          this.currentSubroutine.index += 1
          return
        }
        case '@': {
          this.logger.debug(`Processing line ${this.currentSubroutine.index + 1}: ${line}`)
          const { command, props } = extractCommand(line)
          await this.processCommand(command, props)
          this.currentSubroutine.index += 1
          return
        }
        case '[': {
          this.logger.debug(`Processing line ${this.currentSubroutine.index + 1}: ${line}`)
          const closingIndex = line.indexOf(']', column)

          if (closingIndex === -1) {
            throw new Error(`Unmatched [ at line ${this.currentSubroutine.index + 1}`)
          }

          const text = line.slice(column, closingIndex + 1)
          const { command, props } = extractCommand(text)

          await this.processCommand(command, props)

          column = closingIndex + 1
          break
        }
        default: {
          await this.processText()
          this.currentSubroutine.index += 1
          return
        }
      }
    } while (column < line.length)

    this.currentSubroutine.index += 1
  }

  /**
   * Processes a line that contains commands.
   */
  private async processCommand(command: string, props: Record<string, string>): Promise<void> {
    try {
      const macro = this.macros[command]
      if (macro) {
        await macro(props)
        return
      }

      const blockCommand = checkIsBlockCommand(command)
      if (blockCommand) {
        await this.processBlockCommand(command, props)
        return
      }

      const basicCommand = getCommand(command)
      await basicCommand(this, props)
    }
    catch (error) {
      if (error instanceof UnknownCommandError) {
        this.logger.warn(`Unknown command: ${command} at line ${this.currentSubroutine.index + 1}`)
      }
      else {
        this.logger.error(`Error processing command: ${command} at line ${this.currentSubroutine.index + 1}`, error)
      }
    }
  }

  /**
   * Processes a block command.
   *
   * @param command - The block command to process.
   * @param props - The properties of the command.
   */
  private async processBlockCommand(command: string, props: Record<string, string>): Promise<void> {
    const closingIndex = findClosingBlockCommandIndex(command, this.currentSubroutine.index, this.currentSubroutine.lines)

    const blockLines = this.currentSubroutine.lines.slice(this.currentSubroutine.index + 1, closingIndex)

    switch (command) {
      case 'macro': {
        const { macro, name } = createMacro(this, blockLines, props)
        this.macros[name] = macro
        this.currentSubroutine.index = closingIndex
        break
      }
      case 'iscript':
        await scriptCommand(this, blockLines, props)
        this.currentSubroutine.index = closingIndex
        break
      case 'link': {
        await linkCommand(this, blockLines, props)
        this.currentSubroutine.index = closingIndex
        break
      }
      case 'if': {
        await ifCommand(this, blockLines, props)
        break
      }
    }
  }

  /**
   *
   */
  async run(): Promise<void> {
    do {
      await this.handlePausedState()

      if (this.state === EngineState.STOPPED) {
        return
      }

      try {
        await this.processCurrentLine()
      }
      catch (error) {
        const line = this.currentSubroutine.lines[this.currentSubroutine.index]
        this.logger.error(`Error processing line ${this.currentSubroutine.index + 1}: ${line}`, error)
        this.currentSubroutine.index += 1
      }
    } while (this.currentSubroutine.index < this.currentSubroutine.lines.length)
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
  async processText() {
    const text = this.currentSubroutine.lines[this.currentSubroutine.index]

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
          catch (error) {
            this.logger.error(error)
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
   * Runs the specified subroutine. If `force` is true, it will cancel the current subroutine.
   */
  async runSubroutine() {
    // TODO
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
