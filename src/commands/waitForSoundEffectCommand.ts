import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas/zod'
import { checkCondition } from '../utils/checkCondition'

const schema = z.object({
  canskip: createBooleanSchema().optional(),
  cond: z.string().optional(),
  buf: z.string().optional(),
}).strict()

export async function waitForSoundEffectCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const result = parsed.cond ? await checkCondition(engine, parsed.cond) : true

  if (!result) {
    return
  }

  return new Promise((resolve) => {
    const handleSoundEffectEnded = () => {
      window.removeEventListener('ws', handleSoundEffectEnded)
      resolve()
    }

    window.addEventListener('ws', handleSoundEffectEnded)
  })
}
