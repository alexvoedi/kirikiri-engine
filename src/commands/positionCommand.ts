import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema, createIntegerSchema, createPageSchema } from '../schemas'
import { scaleRange } from '../utils/scaleRange'

const schema = z.object({
  layer: z.string().optional().default('message0'),
  page: createPageSchema().optional().default('fore'),
  left: createIntegerSchema().optional(),
  top: createIntegerSchema().optional(),
  width: createIntegerSchema().optional(),
  height: createIntegerSchema().optional(),
  visible: createBooleanSchema().optional(),
  frame: z.string().optional(),
  opacity: createIntegerSchema(0, 255).transform(v => scaleRange(v, 0, 255, 0, 1)).optional(),
}).strict()

/**
 * Implements the `position` command.
 *
 * Sets the position and other properties of a specified layer.
 */
export async function positionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.setPosition({
    ...parsed,
    x: parsed.left,
    y: parsed.top,
  })
}
