import type { ConsolaInstance } from 'consola'
import type { CommandStorage } from '../types/CommandStorage'
import type { Game } from '../types/Game'
import type { KirikiriEngineOptions } from '../types/KirikiriEngineOptions'
import type { JsonValue, KirikiriSaveGame } from '../types/KirikiriSaveGame'
import type { StorageProvider } from '../types/StorageProvider'
import { createConsola } from 'consola'
import { getCommand } from '../commands/getCommand'
import { ifCommand } from '../commands/ifCommand'
import { linkCommand } from '../commands/linkCommand'
import { createMacro } from '../commands/macroCommand'
import { scriptCommand } from '../commands/scriptCommand'
import { COMMAND_BLOCKS, EngineEvent, GLOBAL_SCRIPT_CONTEXT } from '../constants'
import { EngineState } from '../enums/EngineState'
import { UnknownCommandError } from '../errors/UnknownCommandError'
import { createStorageProvider } from '../storage/createStorageProvider'
import { checkIsBlockCommand } from '../utils/checkIsBlockCommand'
import { extractBlockCommand } from '../utils/extractBlockCommand'
import { extractCommand } from '../utils/extractCommand'
import { extractLabel } from '../utils/extractLabel'
import { extractStorage } from '../utils/extractStorage'
import { removeFileExtension } from '../utils/removeFileExtension'
import { Callstack } from './Callstack'
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

  readonly storage: StorageProvider

  /**
   * All available macros.
   */
  readonly macros: Record<string, (props: Record<string, string>) => Promise<void>> = {}

  private readonly macroDefinitions = new Map<string, {
    lines: string[]
    props: Record<string, JsonValue>
  }>()

  /**
   * Subroutine call stack
   */
  readonly callstack: Callstack

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

    this.storage = createStorageProvider(game)
    this.renderer = new KirikiriRenderer(canvas)
    this.callstack = new Callstack()

    this.logger = createConsola({
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

  /**
   * Start the execution of the engine.
   */
  async start() {
    if (this.state !== EngineState.INITIALIZED) {
      throw new Error('Engine is not initialized')
    }

    this.state = EngineState.RUNNING

    const result = await this.loadFile(this.game.entry)

    this.callstack.push(result)

    await this.run()
  }

  createSaveGame(): KirikiriSaveGame {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      game: {
        entry: this.game.entry,
        root: this.game.root,
      },
      state: this.state,
      callstack: this.callstack.stack.map(entry => ({
        file: entry.file,
        index: entry.index,
      })),
      globalScriptContext: {
        kag: {
          clickCount: this.globalScriptContext.kag.clickCount,
        },
        f: this.toJsonObject(this.globalScriptContext.f),
        sf: this.toJsonObject(this.globalScriptContext.sf),
        tf: this.toJsonObject((this.globalScriptContext as { tf?: Record<string, unknown> }).tf ?? {}),
      },
      commandStorage: this.toJsonObject(this.commandStorage),
      macros: Array.from(this.macroDefinitions.entries()).map(([name, definition]) => ({
        name,
        lines: [...definition.lines],
        props: { ...definition.props },
      })),
    }
  }

  async restoreSaveGame(saveGame: KirikiriSaveGame): Promise<void> {
    if (saveGame.version !== 1) {
      throw new Error(`Unsupported save game version: ${saveGame.version}`)
    }

    this.replaceObject(this.globalScriptContext.f, saveGame.globalScriptContext.f)
    this.replaceObject(this.globalScriptContext.sf, saveGame.globalScriptContext.sf)

    const scriptContextWithTemp = this.globalScriptContext as { tf?: Record<string, unknown> }
    if (saveGame.globalScriptContext.tf) {
      scriptContextWithTemp.tf ??= {}
      this.replaceObject(scriptContextWithTemp.tf, saveGame.globalScriptContext.tf)
    }

    this.globalScriptContext.kag.clickCount = saveGame.globalScriptContext.kag.clickCount
    this.replaceObject(this.commandStorage, saveGame.commandStorage)

    this.clearMacros()
    for (const macro of saveGame.macros) {
      this.registerMacro(macro.name, macro.lines, macro.props)
    }

    this.callstack.stack = []
    for (const frame of saveGame.callstack) {
      const entry = await this.loadFile(frame.file)
      entry.index = frame.index
      this.callstack.push(entry)
    }

    this.state = saveGame.state
  }

  saveGame(slot: string | number): KirikiriSaveGame {
    const saveGame = this.createSaveGame()
    this.getStorage().setItem(this.getSaveGameStorageKey(slot), JSON.stringify(saveGame))

    return saveGame
  }

  async loadSaveGame(slot: string | number): Promise<KirikiriSaveGame> {
    const serialized = this.getStorage().getItem(this.getSaveGameStorageKey(slot))

    if (!serialized) {
      throw new Error(`Save game slot ${slot} not found`)
    }

    const saveGame = JSON.parse(serialized) as KirikiriSaveGame
    await this.restoreSaveGame(saveGame)

    return saveGame
  }

  deleteSaveGame(slot: string | number): void {
    this.getStorage().removeItem(this.getSaveGameStorageKey(slot))
  }

  /**
   * Load the file and register its labels.
   */
  async loadFile(filename: string, label?: string) {
    const lines = await this.loadFileContent(filename)

    const file = removeFileExtension(filename)

    await this.registerLabels(file, lines)
    await this.loadAssets(lines)

    const index = label ? this.labels[file][label] : 0

    return {
      file,
      lines,
      index,
    }
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

        const normalizedStorage = storage.toLowerCase()
        if (
          normalizedStorage.endsWith('.ogg')
          || normalizedStorage.endsWith('.wav')
          || normalizedStorage.endsWith('.mp3')
          || normalizedStorage.endsWith('.mp4')
          || normalizedStorage.endsWith('.mpg')
          || normalizedStorage.endsWith('.mpeg')
        ) {
          index += 1

          continue
        }

        try {
          const path = await this.getAssetUrl(storage)

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

  /**
   * Load the file content with the correct encoding.
   */
  async loadFileContent(filename: string): Promise<string[]> {
    const content = await this.storage.readTextFile(filename, 'shift-jis')

    return content.split('\n')
  }

  /**
   * Given a filename, get the full path to the file.
   */
  async getAssetUrl(filename: string) {
    return this.storage.resolveAssetUrl(filename)
  }

  async getFullFilePath(filename: string) {
    return this.getAssetUrl(filename)
  }

  /**
   * Run the engine from the specified file and index in the callstack.
   */
  async run(): Promise<void> {
    while (this.callstack.length > 0) {
      if (this.state === EngineState.PAUSED) {
        await new Promise<void>((resolve) => {
          globalThis.addEventListener(EngineEvent.CONTINUE, () => resolve(), { once: true })
        })
      }

      if (this.state === EngineState.STOPPED) {
        return
      }

      if (this.callstack.current.index >= this.callstack.current.lines.length) {
        if (this.callstack.length === 1) {
          return
        }

        this.callstack.pop()
        continue
      }

      try {
        await this.processCurrentLine()
      }
      catch (error) {
        const line = this.callstack.currentLine

        this.logger.error(`Error processing line ${this.callstack.current.index + 1}: ${line}`, error)

        this.callstack.current.index += 1
      }
    }
  }

  /**
   * Processes the current line in the callstack.
   */
  private async processCurrentLine(): Promise<void> {
    const line = this.callstack.currentLine

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
          this.callstack.current.index += 1

          return
        }

        case '@': {
          const startLine = this.callstack.current.index
          const { command, props } = extractCommand(line)
          await this.execCommand(command, props)

          if (this.callstack.current.index !== startLine)
            return

          this.callstack.current.index += 1

          return
        }

        case '[': {
          const startLine = this.callstack.current.index
          const closingIndex = line.indexOf(']', column)

          if (closingIndex === -1) {
            throw new Error(`Unmatched [ at line ${this.callstack.current.index + 1}`)
          }

          const text = line.slice(column, closingIndex + 1)
          const { command, props } = extractCommand(text)

          if (Object.values(COMMAND_BLOCKS).includes(command)) {
            column = closingIndex + 1
          }
          else if (checkIsBlockCommand(command)) {
            const block = extractBlockCommand(command, this.callstack.current.lines.slice(startLine), column)

            if (command === 'if' && block.to.line === 0) {
              const shouldProcessContent = await ifCommand(this, block.content, props)
              column = shouldProcessContent ? closingIndex + 1 : block.to.col + 1
              break
            }

            const to = await this.processBlockCommand(command, props, column)

            if (to.line === startLine) {
              column = to.col + 1
            }
            else {
              column = line.length
            }
          }
          else {
            await this.execCommand(command, props)

            if (this.callstack.current.index !== startLine)
              return

            column = closingIndex + 1
          }

          break
        }

        default: {
          await this.processText()

          this.callstack.current.index += 1

          return
        }
      }
    } while (column < line.length)

    this.callstack.current.index += 1
  }

  /**
   * Executes the given command with the provided properties.
   */
  private async execCommand(command: string, props: Record<string, string>): Promise<void> {
    this.logger.debug(`Processing line ${this.callstack.current.index + 1}: ${this.callstack.currentLine}`)

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
        this.logger.warn(`Unknown command: ${command} at line ${this.callstack.current.index + 1}`)
      }
      else {
        this.logger.error(`Error processing command: ${command} at line ${this.callstack.current.index + 1}`, error)
      }
    }
  }

  /**
   * Processes a block command.
   *
   * @param command - The block command to process.
   * @param props - The properties of the command.
   */
  private async processBlockCommand(command: string, props: Record<string, string>, column = 0): Promise<{
    line: number
    col: number
  }> {
    const startLine = this.callstack.current.index
    const { content, to } = extractBlockCommand(command, this.callstack.current.lines.slice(startLine), column)

    switch (command) {
      case 'macro': {
        const { name } = createMacro(this, content, props)
        this.registerMacro(name, content, props)
        break
      }
      case 'iscript':
        await scriptCommand(this, content, props)
        break
      case 'link': {
        await linkCommand(this, content, props)
        break
      }
      case 'if': {
        await ifCommand(this, content, props)
        break
      }
    }

    this.callstack.current.index = startLine + to.line

    return {
      line: startLine + to.line,
      col: to.col,
    }
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
    const text = this.callstack.currentLine

    let skip = false

    const onClick = () => {
      skip = true
    }

    if (this.commandStorage.clickskip?.enabled) {
      globalThis.addEventListener(EngineEvent.CLICK, onClick, { once: true })
    }

    let index = 0
    while (index < text.length) {
      const character = text.charAt(index)

      if (character !== '[') {
        await this.addCharacter(character, { skip })

        index += 1

        continue
      }

      const { command, props, to } = extractCommand(text, index)
      let nextIndex = to + 1

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
            else if (Object.values(COMMAND_BLOCKS).includes(command)) {
              // Closing tags for inline blocks are consumed by their opener.
            }
            else if (checkIsBlockCommand(command)) {
              const block = extractBlockCommand(command, [text], index)

              switch (command) {
                case 'iscript':
                  await scriptCommand(this, block.content, props)
                  break
                case 'link':
                  await linkCommand(this, block.content, props)
                  break
                case 'if':
                  await ifCommand(this, block.content, props)
                  break
              }

              nextIndex = block.to.col + 1
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

      index = nextIndex
    }

    if (this.commandStorage.clickskip?.enabled) {
      globalThis.removeEventListener(EngineEvent.CLICK, onClick)
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
      globalThis.dispatchEvent(new CustomEvent(EngineEvent.CONTINUE))
    }

    this.logger.debug(`Engine state changed to: ${state}`)
  }

  private registerMacro(name: string, lines: string[], props: Record<string, unknown>) {
    const normalizedProps = this.toJsonObject(props)
    const { macro } = createMacro(this, lines, {
      ...normalizedProps,
      name,
    })

    this.macros[name] = macro
    this.macroDefinitions.delete(name)
    this.macroDefinitions.set(name, {
      lines: [...lines],
      props: normalizedProps,
    })
  }

  private clearMacros() {
    Object.keys(this.macros).forEach((name) => {
      delete this.macros[name]
    })

    this.macroDefinitions.clear()
  }

  private getStorage(): Storage {
    if (!globalThis.localStorage) {
      throw new Error('localStorage is not available')
    }

    return globalThis.localStorage
  }

  private getSaveGameStorageKey(slot: string | number) {
    return `kirikiri-engine:${this.game.root}:${this.game.entry}:save:${slot}`
  }

  private replaceObject(target: object, source: Record<string, JsonValue>) {
    const targetRecord = target as Record<string, unknown>

    Object.keys(targetRecord).forEach((key) => {
      delete targetRecord[key]
    })

    Object.assign(targetRecord, this.toJsonObject(source))
  }

  private toJsonObject(value: object): Record<string, JsonValue> {
    return this.toJsonValue(value) as Record<string, JsonValue>
  }

  private toJsonValue(value: unknown): JsonValue | undefined {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value
    }

    if (Array.isArray(value)) {
      return value
        .map(item => this.toJsonValue(item))
        .filter(item => item !== undefined)
    }

    if (typeof value === 'object') {
      if (typeof EventTarget !== 'undefined' && value instanceof EventTarget) {
        return undefined
      }

      const result: Record<string, JsonValue> = {}

      Object.entries(value).forEach(([key, item]) => {
        const jsonValue = this.toJsonValue(item)

        if (jsonValue !== undefined) {
          result[key] = jsonValue
        }
      })

      return result
    }

    return undefined
  }
}
