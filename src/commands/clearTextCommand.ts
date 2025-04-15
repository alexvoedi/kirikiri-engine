import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `ct` command.
 *
 * Resets the message layer. Everything is resettet to normal. Also, the message layer is removed.
 */
export async function clearTextCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  engine.renderer.clearText()
}
