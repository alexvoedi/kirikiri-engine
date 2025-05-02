import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { checkIsBlockCommand } from '../utils/checkIsBlockCommand'
import { extractCommand } from '../utils/extractCommand'
import { findClosingBlockCommandIndex } from '../utils/findClosingBlockCommandIndex'
import { getPlacholders } from '../utils/getPlaceholders'
import { getCommand } from './getCommand'
import { ifCommand } from './ifCommand'
import { scriptCommand } from './scriptCommand'

const schema = z.object({
  name: z.string(),
})

/**
 * Implements the `macro` command.
 *
 * Defines a macro that can be called later.
 */
export function createMacro(engine: KirikiriEngine, lines: string[], props: Record<string, unknown>) {
  const parsed = schema.parse(props)

  const commands = processLines(engine, lines)

  return {
    name: parsed.name,
    macro: async (props: Record<string, string>): Promise<void> => {
      for (const command of commands) {
        try {
          const requiredProps: Record<string, string> = {}

          if (command.placeholders) {
            Object.keys(command.placeholders).forEach((key) => {
              requiredProps[key] = props[key]
            })
          }

          await command.command(requiredProps)
        }
        catch (e) {
          engine.logger.error(`Error processing command:`, e)
        }
      }
    },
  }
}

/**
 * Collects all commands that are called when running the macro.
 */
function processLines(engine: KirikiriEngine, lines: string[]): Array<{
  command: (props: Record<string, string>) => Promise<void>
  placeholders?: Record<string, string>
}> {
  const commands: Array<{
    command: (props: Record<string, string>) => Promise<void>
    placeholders?: Record<string, string>
  }> = []

  let index = 0

  do {
    const line = lines[index]

    const firstCharacter = line.charAt(0)

    try {
      switch (firstCharacter) {
        case '[': {
          const { command, props } = extractCommand(line)

          const macro = engine.macros[command]
          if (macro) {
            commands.push({
              command: macro,
            })

            index += 1
            break
          }

          const isBlockCommand = checkIsBlockCommand(command)
          if (isBlockCommand) {
            const closingIndex = findClosingBlockCommandIndex(command, index, lines)

            const blockLines = lines.slice(index + 1, closingIndex)

            switch (command) {
              case 'iscript': {
                const callback = async () => await scriptCommand(engine, blockLines, props)

                commands.push({
                  command: callback,
                })

                break
              }
              case 'link': {
                // todo
                break
              }
              case 'macro': {
                // todo?
                break
              }
              case 'if': {
                const callback = async () => await ifCommand(engine, lines, props)

                commands.push({
                  command: callback,
                })

                break
              }
            }

            index = closingIndex + 1
            break
          }
          else {
            const commandFunction = getCommand(command)
            const callback = (replacedProps: Record<string, string>): Promise<void> => commandFunction(engine, { ...props, ...replacedProps })

            const placeholders = getPlacholders(line)

            commands.push({
              command: callback,
              placeholders,
            })

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
      engine.logger.error(line, error)

      index += 1
    }
  } while (index < lines.length)

  return commands
}
