import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createFloatSchema } from '../schemas/zod'

const schema = z.object({
  time: createFloatSchema(),
  method: z.enum(['universal', 'scroll', 'crossfade', 'turn', 'rotatezoom']).optional().default('crossfade'),
  bgcolor: z.string().optional(),
  factor: z.string()
    .transform(value => Number.parseFloat(value))
    .refine(value => !Number.isNaN(value), { message: 'Invalid number for \'factor\'' })
    .optional(),
  storage: z.string().optional(),
  rule: z.string().optional(),
  vague: z.string().optional(),
}).strict()

export async function transitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.transition(parsed.method, {
    time: parsed.time,
  })
}
