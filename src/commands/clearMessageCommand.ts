import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `cm` command.
 *
 * Removes all messages from the message layers.
 */
export async function clearMessageCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  engine.renderer.clearMessageLayers()
}
