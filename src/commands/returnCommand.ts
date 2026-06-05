import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { jumpCommand } from './jumpCommand'

const schema = z.object({
  storage: z.string().optional(),
  target: z.string().optional(),
}).strict()

/**
 * Implements the `return` command.
 *
 * Returns from a subroutine created by the `call` command.
 */
export async function returnCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  if (engine.callstack.length > 1) {
    engine.callstack.pop()
  }

  if (parsed.storage || parsed.target) {
    await jumpCommand(engine, parsed)
  }
}
