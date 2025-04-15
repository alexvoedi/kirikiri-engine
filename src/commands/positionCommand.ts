import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createAlphanumericSchema, createBooleanSchema, createIntegerSchema, createPageSchema } from '../schemas/zod'

const schema = z.object({
  layer: createAlphanumericSchema().optional(),
  page: createPageSchema().optional(),
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

  engine.renderer.setPosition(parsed)
}
