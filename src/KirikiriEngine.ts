import type { ConsolaInstance } from 'consola'
import type { Game } from './types/Game'
import type { KirikiriEngineOptions } from './types/KirikiriEngineOptions'
import { createConsola } from 'consola'
import Konva from 'konva'
import { createMacro } from './commands/createMacro'
import { UnknownCommandError } from './errors/UnknownCommandError'
import { CommandFactory } from './factories/CommandFactory'
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
  private readonly unprocessedFiles: string[]

  /**
   * List of files that were processed.
   */
  private readonly processdFiles: Record<string, unknown>

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
   * All available macros.
   */
  readonly macros: Record<string, (props: Record<string, string>) => Promise<void>> = {}

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

    this.unprocessedFiles = []
    this.processdFiles = {}

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

    try {
      await this.processLines(lines)
    }
    catch (e) {
      this.logger.error(e)
    }
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
              }
            }

            index = closingIndex + 1
            break
          }
          else {
            try {
              const commandFunction = CommandFactory.create(command, props, this)
              processedLines.commands.push(commandFunction)

              const placeholders = getPlacholders(line)

              if (Object.keys(placeholders).length > 0) {
                processedLines.placeholders[index] = placeholders
              }
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
    } while (index < lines.length)

    return processedLines
  }
}
