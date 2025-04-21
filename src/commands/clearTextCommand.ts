import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `ct` command.
 *
 * Removes all messages from the message layers and resets the message layer and page to default.
 */
export async function clearTextCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  engine.renderer.clearText()
}
