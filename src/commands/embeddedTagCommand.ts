import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  exp: z.string(),
}).strict()

/**
 * Implements the `emb` command.
 *
 * TODO
 */
export async function embeddedTagCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  engine.logger.warn('Unimplemented command', 'embeddedTagCommand')
}
