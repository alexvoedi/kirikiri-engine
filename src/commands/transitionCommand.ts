import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createBooleanSchema, createFloatSchema, createIntegerSchema } from '../schemas'

const schema = z.object({
  time: createFloatSchema(),
  method: z.string().optional().default('crossfade'),
  bgcolor: z.string().optional(),
  factor: createFloatSchema().optional(),
  storage: z.string().optional(),
  rule: z.string().optional(),
  vague: createIntegerSchema().optional(),
  children: createBooleanSchema().optional().default(true),
}).strict()

/**
 * Implements the `trans` command.
 *
 * Moves all back layers to the front with a transition effect.
 */
export async function transitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const onTransitionEnded = () => {
    merge(engine.commandStorage, {
      trans: {
        transitioning: false,
      },
    })

    globalThis.removeEventListener(EngineEvent.TRANSITION_ENDED, onTransitionEnded)
  }

  globalThis.addEventListener(EngineEvent.TRANSITION_ENDED, onTransitionEnded)

  return new Promise((resolve) => {
    merge(engine.commandStorage, {
      trans: {
        transitioning: true,
      },
    })

    engine.renderer.transition(parsed)

    resolve()
  })
}
