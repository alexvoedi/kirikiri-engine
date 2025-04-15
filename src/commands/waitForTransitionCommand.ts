import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'

const schema = z.object({
  canskip: z.string().transform(value => value === 'true').optional(),
})

export async function waitForTransitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  const transitioning = engine.commandStorage.trans?.transitioning ?? false

  return new Promise((resolve) => {
    if (!transitioning) {
      resolve()
    }
    else {
      const handleTransitionEnded = () => {
        merge(engine.commandStorage, {
          trans: {
            transitioning: false,
          },
        })
        window.removeEventListener('wt', handleTransitionEnded)
        resolve()
      }

      window.addEventListener('wt', handleTransitionEnded)
    }
  })
}
