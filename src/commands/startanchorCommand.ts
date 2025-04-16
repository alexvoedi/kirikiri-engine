import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
}).strict()

/**
 * Implements the `startanchor` command.
 *
 * This is the point where the engine goes to when the "Go to Menu" function is called.
 */
export async function startanchorCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  engine.logger.warn('Unimplemented command', 'buttonCommand')
}
