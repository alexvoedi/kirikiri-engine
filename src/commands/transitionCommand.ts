import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createBooleanSchema, createFloatSchema, createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  time: createFloatSchema(),
  method: z.enum(['universal', 'scroll', 'crossfade', 'turn', 'rotatezoom']).optional().default('crossfade'),
  bgcolor: z.string().optional(),
  factor: createFloatSchema().optional(),
  storage: z.string().optional(),
  rule: z.string().optional(),
  vague: createIntegerSchema().optional(),
  children: createBooleanSchema().optional().default(true),
}).strict()

export async function transitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const onTransitionEnded = () => {
    merge(engine.commandStorage, {
      trans: {
        transitioning: false,
      },
    })

    window.removeEventListener(EngineEvent.TRANSITION_ENDED, onTransitionEnded)
  }

  window.addEventListener(EngineEvent.TRANSITION_ENDED, onTransitionEnded)

  return new Promise((resolve) => {
    merge(engine.commandStorage, {
      trans: {
        transitioning: true,
      },
    })

    engine.renderer.transition(parsed.method, {
      time: parsed.time,
      children: parsed.children,
    })

    resolve()
  })
}
