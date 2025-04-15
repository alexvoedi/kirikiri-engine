import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { createFloatSchema, createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  time: createFloatSchema(),
  method: z.enum(['universal', 'scroll', 'crossfade', 'turn', 'rotatezoom']).optional().default('crossfade'),
  bgcolor: z.string().optional(),
  factor: createFloatSchema().optional(),
  storage: z.string().optional(),
  rule: z.string().optional(),
  vague: createIntegerSchema().optional(),
}).strict()

export async function transitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  return new Promise((resolve) => {
    merge(engine.commandStorage, {
      trans: {
        transitioning: true,
      },
    })

    engine.renderer.transition(parsed.method, {
      time: parsed.time,
    })

    resolve()
  })
}
