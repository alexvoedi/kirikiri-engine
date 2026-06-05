import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  storage: z.string().optional(),
  target: z.string().optional(),
}).strict()

/**
 * Implements the `call` command.
 *
 * Runs a subroutine.
 *
 * Compared to the `jump` command, this will go back to the previous line after the subroutine is finished.
 */
export async function callCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const current = engine.callstack.current
  current.index += 1
  const label = parsed.target?.replace(/^\*/, '')

  if (parsed.storage) {
    try {
      const result = await engine.loadFile(parsed.storage, label)
      engine.callstack.push(result)
    }
    catch (error) {
      engine.logger.warn(`Skipping call to ${parsed.storage}: ${error}`)
    }
  }
  else {
    engine.callstack.push({
      file: current.file,
      lines: current.lines,
      index: label ? engine.labels[current.file][label] : 0,
    })
  }
}
