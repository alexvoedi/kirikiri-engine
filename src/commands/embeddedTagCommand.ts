import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  exp: z.string(),
}).strict()

/**
 * Evaluates the expression and replaces the tag with the result.
 */
export async function embeddedTagCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
