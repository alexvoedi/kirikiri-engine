import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
}).strict()

/**
 * Implements the `er` command.
 *
 * Deletes everything from the message layer.
 */
export async function deleteMessageLayerChildrenCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  engine.renderer.clearMessageLayerPages()
}
