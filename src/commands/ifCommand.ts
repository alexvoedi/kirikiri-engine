import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { checkCondition } from '../utils/checkCondition'

const schema = z.object({
  exp: z.string(),
}).strict()

/**
 * Implements the `if` command.
 *
 * Executes a block of code if the given condition is true.
 */
export async function ifCommand(engine: KirikiriEngine, lines: string[], props?: Record<string, unknown>): Promise<boolean> {
  const parsed = schema.parse(props)

  return await checkCondition(engine, parsed.exp)
}
