import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema, createIntegerSchema, createPageSchema } from '../schemas'

const schema = z.object({
  layer: z.string().optional().default('message0'),
  page: createPageSchema().optional().default('fore'),
  left: createIntegerSchema().optional(),
  top: createIntegerSchema().optional(),
  width: createIntegerSchema().optional(),
  height: createIntegerSchema().optional(),
  visible: createBooleanSchema().optional(),
  frame: z.string().optional(),
  opacity: createIntegerSchema(0, 255).optional(),
}).strict()

export async function positionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.setPosition({
    ...parsed,
    x: parsed.left,
    y: parsed.top,
  })
}
