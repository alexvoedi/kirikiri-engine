import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({
  canskip: z.string().transform(value => value === 'true').optional(),
})

/**
 * Implements the `wt` command.
 *
 * Wait for the current transition to finish.
 */
export async function waitForTransitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  const transitioning = engine.commandStorage.trans?.transitioning ?? false

  return new Promise((resolve) => {
    if (!transitioning) {
      resolve()
    }
    else {
      window.addEventListener(EngineEvent.TRANSITION_ENDED, () => {
        merge(engine.commandStorage, {
          trans: {
            transitioning: false,
          },
        })

        resolve()
      }, { once: true })
    }
  })
}
