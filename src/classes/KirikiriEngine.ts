import type { ConsolaInstance } from 'consola'
import type { CommandStorage } from '../types/CommandStorage'
import type { Game } from '../types/Game'
import type { KirikiriEngineOptions } from '../types/KirikiriEngineOptions'
import type { JsonValue, KirikiriInteractionSnapshot, KirikiriSaveGame, KirikiriStoredSaveEntry } from '../types/KirikiriSaveGame'
import type { StorageProvider } from '../types/StorageProvider'
import { createConsola } from 'consola'
import { evalCommand } from '../commands/evalCommand'
import { getCommand } from '../commands/getCommand'
import { ifCommand } from '../commands/ifCommand'
import { jumpCommand } from '../commands/jumpCommand'
import { linkCommand } from '../commands/linkCommand'
import { createMacro } from '../commands/macroCommand'
import { playBackgroundMusicCommand } from '../commands/playBackgroundMusicCommand'
import { scriptCommand } from '../commands/scriptCommand'
import { COMMAND_BLOCKS, EngineEvent, GLOBAL_SCRIPT_CONTEXT } from '../constants'
import { EngineState } from '../enums/EngineState'
import { UnknownCommandError } from '../errors/UnknownCommandError'
import { createStorageProvider } from '../storage/createStorageProvider'
import { checkCondition } from '../utils/checkCondition'
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

  private gameplayClickBridgeInstalled = false

  private readonly macroDefinitions = new Map<string, {
    lines: string[]
    props: Record<string, JsonValue>
  }>()

  private executionCheckpoint?: {
    file: string
    lineIndex: number
    textOffset: number
  }

  private systemMenuElement?: HTMLDivElement
  private systemMenuResumeState?: EngineState

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
    this.installGameplayClickBridge()
    this.installSystemMenu()

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
      renderer: this.renderer.createSnapshot(),
      executionCheckpoint: this.executionCheckpoint && {
        ...this.executionCheckpoint,
      },
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
    this.cleanupRuntimeState()
    this.replaceObject(this.commandStorage, saveGame.commandStorage)
    this.executionCheckpoint = saveGame.executionCheckpoint
      ? {
          ...saveGame.executionCheckpoint,
        }
      : undefined

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

    if (saveGame.renderer) {
      await this.renderer.restoreSnapshot(saveGame.renderer, {
        createInteractionHandler: interaction => this.createInteractionHandler(interaction),
        resolveStorage: storage => this.getAssetUrl(storage),
      })
    }

    await this.restoreRuntimeState()
    this.state = saveGame.state
  }

  saveGame(slot: string | number): KirikiriSaveGame {
    const saveGame = this.createSaveGame()
    const entry = this.createStoredSaveEntry('slot', String(slot), saveGame)
    this.getStorage().setItem(this.getSaveGameStorageKey(slot), JSON.stringify(entry))

    return saveGame
  }

  async loadSaveGame(slot: string | number, options?: {
    resume?: boolean
  }): Promise<KirikiriSaveGame> {
    const serialized = this.getStorage().getItem(this.getSaveGameStorageKey(slot))

    if (!serialized) {
      throw new Error(`Save game slot ${slot} not found`)
    }

    const parsed = JSON.parse(serialized) as KirikiriSaveGame | KirikiriStoredSaveEntry
    const saveGame = this.extractSaveGame(parsed)
    await this.restoreSaveGame(saveGame)
    if (options?.resume) {
      await this.resumeAfterRestore(saveGame)
    }

    return saveGame
  }

  deleteSaveGame(slot: string | number): void {
    this.getStorage().removeItem(this.getSaveGameStorageKey(slot))
  }

  createSnapshot(name?: string): KirikiriStoredSaveEntry {
    const saveGame = this.createSaveGame()
    const createdAt = saveGame.createdAt
    const id = `${Date.now()}`
    const entry = this.createStoredSaveEntry('snapshot', id, saveGame, {
      title: name?.trim() || new Date(createdAt).toLocaleString(),
    })

    this.getStorage().setItem(this.getSnapshotStorageKey(id), JSON.stringify(entry))

    return entry
  }

  async loadSnapshot(id: string, options?: {
    resume?: boolean
  }): Promise<KirikiriStoredSaveEntry> {
    const serialized = this.getStorage().getItem(this.getSnapshotStorageKey(id))

    if (!serialized) {
      throw new Error(`Snapshot ${id} not found`)
    }

    const entry = JSON.parse(serialized) as KirikiriStoredSaveEntry
    await this.restoreSaveGame(entry.saveGame)

    if (options?.resume ?? true) {
      await this.resumeAfterRestore(entry.saveGame)
    }

    return entry
  }

  deleteSnapshot(id: string): void {
    this.getStorage().removeItem(this.getSnapshotStorageKey(id))
  }

  listSnapshots(): KirikiriStoredSaveEntry[] {
    return this.listStoredEntries('snapshot')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  listSaveGames(slots = 8): Array<KirikiriStoredSaveEntry | null> {
    const result: Array<KirikiriStoredSaveEntry | null> = []

    for (let index = 1; index <= slots; index += 1) {
      const serialized = this.getStorage().getItem(this.getSaveGameStorageKey(index))

      if (!serialized) {
        result.push(null)
        continue
      }

      const parsed = JSON.parse(serialized) as KirikiriSaveGame | KirikiriStoredSaveEntry
      if ('saveGame' in parsed) {
        result.push(parsed)
      }
      else {
        result.push(this.createStoredSaveEntry('slot', String(index), parsed))
      }
    }

    return result
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
          const resumeOffset = this.executionCheckpoint?.file === this.callstack.current.file
            && this.executionCheckpoint.lineIndex === this.callstack.current.index
            ? this.executionCheckpoint.textOffset
            : 0

          await this.processText(resumeOffset)
          this.executionCheckpoint = undefined

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
      if (!await this.shouldExecuteCommand(command, props)) {
        return
      }

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

    if (!await this.shouldExecuteCommand(command, props)) {
      this.callstack.current.index = startLine + to.line

      return {
        line: startLine + to.line,
        col: to.col,
      }
    }

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
  async processText(startOffset = 0) {
    const text = this.callstack.currentLine

    let skip = false

    const onClick = () => {
      skip = true
    }

    if (this.commandStorage.clickskip?.enabled) {
      globalThis.addEventListener(EngineEvent.CLICK, onClick, { once: true })
    }

    let index = startOffset
    while (index < text.length) {
      const character = text.charAt(index)

      if (character !== '[') {
        this.executionCheckpoint = {
          file: this.callstack.current.file,
          lineIndex: this.callstack.current.index,
          textOffset: index + 1,
        }
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
            this.executionCheckpoint = {
              file: this.callstack.current.file,
              lineIndex: this.callstack.current.index,
              textOffset: nextIndex,
            }
            await this.addCharacter('\n', { skip })
            break
          }
          default: {
            if (!await this.shouldExecuteCommand(command, props)) {
              if (checkIsBlockCommand(command)) {
                const block = extractBlockCommand(command, [text], index)
                nextIndex = block.to.col + 1
              }

              break
            }

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
                this.executionCheckpoint = {
                  file: this.callstack.current.file,
                  lineIndex: this.callstack.current.index,
                  textOffset: index,
                }
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

  waitForGameClick(options?: {
    countClick?: boolean
  }) {
    return new Promise<void>((resolve) => {
      const onClick = () => {
        if (options?.countClick) {
          this.globalScriptContext.kag.clickCount += 1
        }

        resolve()
      }

      this.canvas.addEventListener('click', onClick, { once: true })
    })
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

  private getSnapshotStorageKey(id: string) {
    return `kirikiri-engine:${this.game.root}:${this.game.entry}:snapshot:${id}`
  }

  private async shouldExecuteCommand(command: string, props: Record<string, string>) {
    if (!props.cond) {
      return true
    }

    if (['macro', 'if', 'iscript'].includes(command)) {
      return true
    }

    return await checkCondition(this, props.cond)
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

  private async restoreRuntimeState() {
    const bgm = this.commandStorage.playbgm as Record<string, JsonValue> | undefined

    if (bgm?.storage && bgm.playing) {
      await playBackgroundMusicCommand(this, {
        storage: String(bgm.storage),
        loop: String(bgm.loop ?? true),
      })
    }
  }

  private cleanupRuntimeState() {
    this.commandStorage.playbgm?.cleanup?.()
    this.commandStorage.playse?.cleanup?.()
    this.commandStorage.video?.cleanup?.()
  }

  private extractSaveGame(value: KirikiriSaveGame | KirikiriStoredSaveEntry) {
    return 'saveGame' in value ? value.saveGame : value
  }

  private createStoredSaveEntry(kind: 'slot' | 'snapshot', id: string, saveGame: KirikiriSaveGame, overrides?: {
    title?: string
  }): KirikiriStoredSaveEntry {
    return {
      version: 1,
      kind,
      id,
      createdAt: saveGame.createdAt,
      title: overrides?.title ?? `${kind === 'slot' ? `Slot ${id}` : 'Snapshot'} ${id}`,
      preview: this.getSavePreview(),
      saveGame,
    }
  }

  private getSavePreview() {
    const currentLine = this.callstack.currentLine ?? ''
    const normalized = currentLine
      .replace(/\[[^\]]+\]/g, '')
      .replace(/^[;*\\@]+/, '')
      .trim()

    if (normalized) {
      return normalized.slice(0, 80)
    }

    return `${this.callstack.current?.file ?? 'unknown'}:${(this.callstack.current?.index ?? 0) + 1}`
  }

  private listStoredEntries(kind: 'slot' | 'snapshot') {
    const prefix = `kirikiri-engine:${this.game.root}:${this.game.entry}:${kind}:`
    const entries: KirikiriStoredSaveEntry[] = []

    for (let index = 0; index < this.getStorage().length; index += 1) {
      const key = this.getStorage().key(index)

      if (!key || !key.startsWith(prefix)) {
        continue
      }

      const serialized = this.getStorage().getItem(key)
      if (!serialized) {
        continue
      }

      const parsed = JSON.parse(serialized) as KirikiriStoredSaveEntry
      if ('saveGame' in parsed) {
        entries.push(parsed)
      }
    }

    return entries
  }

  private async resumeAfterRestore(saveGame: KirikiriSaveGame) {
    if (saveGame.state === EngineState.STOPPED) {
      return
    }

    this.setState(EngineState.RUNNING)
    await this.run()
  }

  private createInteractionHandler(interaction: KirikiriInteractionSnapshot) {
    return async () => {
      if (interaction.exp) {
        await evalCommand(this, {
          exp: interaction.exp,
        })
      }

      if (interaction.target || interaction.storage) {
        if (interaction.type === 'link') {
          globalThis.dispatchEvent(new CustomEvent(EngineEvent.CHOICE))
        }

        const jumpProps: Record<string, string> = {}
        if (interaction.target) {
          jumpProps.target = interaction.target
        }
        if (interaction.storage) {
          jumpProps.storage = interaction.storage
        }

        await jumpCommand(this, jumpProps)
      }

      this.setState(EngineState.RUNNING)
      await this.run()
    }
  }

  private installSystemMenu() {
    if (typeof document === 'undefined' || this.systemMenuElement) {
      return
    }

    const menu = document.createElement('div')
    menu.style.position = 'fixed'
    menu.style.zIndex = '10001'
    menu.style.display = 'none'
    menu.style.minWidth = '360px'
    menu.style.maxWidth = 'min(92vw, 520px)'
    menu.style.maxHeight = '80vh'
    menu.style.overflow = 'auto'
    menu.style.padding = '12px'
    menu.style.border = '1px solid rgba(255,255,255,0.18)'
    menu.style.background = 'rgba(18,18,18,0.96)'
    menu.style.color = '#f5f5f5'
    menu.style.font = '12px/1.4 monospace'
    menu.style.boxShadow = '0 16px 48px rgba(0,0,0,0.4)'
    document.body.append(menu)
    this.systemMenuElement = menu

    this.canvas.addEventListener('contextmenu', (event) => {
      if (this.commandStorage.rclick?.enabled === false) {
        return
      }

      event.preventDefault()
      void this.openSystemMenu(event.clientX, event.clientY)
    })

    document.addEventListener('click', (event) => {
      if (!this.systemMenuElement || this.systemMenuElement.style.display === 'none') {
        return
      }

      if (event.target instanceof Node && this.systemMenuElement.contains(event.target)) {
        return
      }

      this.closeSystemMenu()
    })
  }

  private installGameplayClickBridge() {
    if (this.gameplayClickBridgeInstalled) {
      return
    }

    this.canvas.addEventListener('click', () => {
      globalThis.dispatchEvent(new CustomEvent(EngineEvent.CLICK))
    })

    this.gameplayClickBridgeInstalled = true
  }

  private async openSystemMenu(x: number, y: number) {
    if (!this.systemMenuElement) {
      return
    }

    this.systemMenuResumeState = this.state
    this.setState(EngineState.PAUSED)
    this.systemMenuElement.style.left = `${Math.max(8, x)}px`
    this.systemMenuElement.style.top = `${Math.max(8, y)}px`
    this.systemMenuElement.style.display = 'block'
    this.renderSystemMenu()
  }

  private closeSystemMenu(options?: {
    resume?: boolean
  }) {
    if (!this.systemMenuElement) {
      return
    }

    this.systemMenuElement.style.display = 'none'
    this.systemMenuElement.innerHTML = ''

    if ((options?.resume ?? true) && this.systemMenuResumeState && this.systemMenuResumeState !== EngineState.STOPPED) {
      this.setState(EngineState.RUNNING)
    }

    this.systemMenuResumeState = undefined
  }

  private renderSystemMenu() {
    if (!this.systemMenuElement) {
      return
    }

    const snapshots = this.listSnapshots()
    const slots = this.listSaveGames()
    const snapshotDefaultName = new Date().toLocaleString()

    this.systemMenuElement.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong>System Menu</strong>
        <button data-action="close" type="button">Resume</button>
      </div>
      <div style="margin-bottom:12px;">
        <div style="margin-bottom:6px;"><strong>Save Slots</strong></div>
        ${slots.map((entry, index) => `
          <div style="display:grid;grid-template-columns:52px 1fr auto auto;gap:8px;align-items:center;margin-bottom:6px;">
            <span>Slot ${index + 1}</span>
            <span>${entry ? `${entry.title} | ${entry.preview}` : 'Empty'}</span>
            <button data-action="save-slot" data-slot="${index + 1}" type="button">Save</button>
            <button data-action="load-slot" data-slot="${index + 1}" type="button" ${entry ? '' : 'disabled'}>Load</button>
          </div>
        `).join('')}
      </div>
      <div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
          <strong>Snapshots</strong>
          <input data-action="snapshot-name" type="text" value="${escapeHtml(snapshotDefaultName)}" style="flex:1;min-width:0;" />
          <button data-action="create-snapshot" type="button">Create</button>
        </div>
        ${snapshots.length > 0
          ? snapshots.map(entry => `
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;margin-bottom:6px;">
              <span>${escapeHtml(entry.title)} | ${escapeHtml(entry.preview)}</span>
              <button data-action="load-snapshot" data-id="${entry.id}" type="button">Load</button>
              <button data-action="delete-snapshot" data-id="${entry.id}" type="button">Delete</button>
            </div>
          `).join('')
          : '<div>No snapshots yet.</div>'}
      </div>
    `

    this.systemMenuElement.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        void this.handleSystemMenuAction(button.dataset.action, button.dataset.slot, button.dataset.id)
      })
    })
  }

  private async handleSystemMenuAction(action?: string, slot?: string, id?: string) {
    switch (action) {
      case 'close':
        this.closeSystemMenu()
        break
      case 'save-slot':
        if (slot) {
          this.saveGame(slot)
          this.renderSystemMenu()
        }
        break
      case 'load-slot':
        if (slot) {
          this.closeSystemMenu({ resume: false })
          await this.loadSaveGame(slot, { resume: true })
        }
        break
      case 'create-snapshot': {
        const input = this.systemMenuElement?.querySelector<HTMLInputElement>('input[data-action="snapshot-name"]')
        this.createSnapshot(input?.value)
        this.renderSystemMenu()
        break
      }
      case 'load-snapshot':
        if (id) {
          this.closeSystemMenu({ resume: false })
          await this.loadSnapshot(id, { resume: true })
        }
        break
      case 'delete-snapshot':
        if (id) {
          this.deleteSnapshot(id)
          this.renderSystemMenu()
        }
        break
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
