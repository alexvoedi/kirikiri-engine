import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema, createIntegerSchema } from '../schemas'

const schema = z.object({
  layer: z.string(),
  page: z.enum(['fore', 'back']).optional().default('fore'),
  visible: createBooleanSchema().optional(),
  autohide: createBooleanSchema().optional(),
  index: createIntegerSchema(0).optional(),
}).strict()

/**
 * Implements the `layopt` command.
 *
 * Sets options for a layer.
 */
export async function layerOptionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.setLayerOptions(parsed)
}
