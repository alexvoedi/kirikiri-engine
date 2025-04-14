import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  canskip: z.string().transform(value => value === 'true').optional(),
})

export async function waitForTransitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  return new Promise((resolve) => {
    const handleTransitionEnded = () => {
      window.removeEventListener('wt', handleTransitionEnded)
      resolve()
    }

    window.addEventListener('wt', handleTransitionEnded)
  })
}
