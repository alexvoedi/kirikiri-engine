import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  canskip: z.string().transform(value => value === 'true').optional(),
})

export async function waitForTransitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
