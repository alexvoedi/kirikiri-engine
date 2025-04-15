import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z, ZodError } from 'zod'
import { UnknownCommandError } from '../errors/UnknownCommandError'
import { checkIsBlockCommand } from '../utils/checkIsBlockCommand'
import { extractCommand } from '../utils/extractCommand'
import { findClosingBlockCommandIndex } from '../utils/findClosingBlockCommandIndex'
import { getPlacholders } from '../utils/getPlaceholders'
import { ifCommand } from './ifCommand'
import { scriptCommand } from './scriptCommand'

const schema = z.object({
  name: z.string(),
  lines: z.array(z.string()),
})

export function createMacro(engine: KirikiriEngine, props: Record<string, unknown>) {
  const parsed = schema.parse(props)

  const { commands, placeholders } = processLines(engine, parsed.lines)

  return {
    name: parsed.name,
    macro: async (props: Record<string, string>): Promise<void> => {
      for (const [index, command] of commands.entries()) {
        try {
          if (placeholders[index]) {
            const requiredProps: Record<string, string> = {}

            Object.keys(placeholders[index]).forEach((key) => {
              requiredProps[key] = props[key]
            })

            await command(requiredProps)
          }
          else {
            await command({})
          }
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
function processLines(engine: KirikiriEngine, lines: string[]) {
  const processedLines: {
    commands: Array<
      (props: Record<string, string>) => Promise<void>
    >
    placeholders: Record<number, Record<string, string>>
  } = {
    commands: [],
    placeholders: {},
  }

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
            processedLines.commands.push(macro)

            index += 1
            break
          }

          const isBlockCommand = checkIsBlockCommand(command)
          if (isBlockCommand) {
            const closingIndex = findClosingBlockCommandIndex(command, index, lines)

            // Get the lines between the opening and closing block command
            const blockLines = lines.slice(index + 1, closingIndex)

            switch (command) {
              case 'iscript': {
                const callback = async () => await scriptCommand(engine, blockLines, props)

                processedLines.commands.push(callback)

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
                const callback = async () => await ifCommand(engine, {
                  ...props,
                  lines: blockLines,
                })

                processedLines.commands.push(callback)

                break
              }
            }

            index = closingIndex + 1
            break
          }
          else {
            try {
              const commandFunction = engine.getCommand(command)
              const callback = (replacedProps: Record<string, string>): Promise<void> => commandFunction(engine, { ...props, ...replacedProps })
              processedLines.commands.push(callback)

              const placeholders = getPlacholders(line)

              processedLines.placeholders[index] = placeholders
            }
            catch (error) {
              if (error instanceof UnknownCommandError) {
                engine.logger.warn(`Unknown command: ${command} at line ${index + 1}`)
              }
              else {
                engine.logger.error(`Error processing command: ${command} at line ${index + 1}`, error)
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
            engine.logger.error(line, error)
          }
        })
      }

      index += 1
    }
  } while (index < lines.length)

  return processedLines
}
