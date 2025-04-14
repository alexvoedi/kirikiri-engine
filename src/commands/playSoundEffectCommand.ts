import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  storage: z.string(),
  buf: z.string().optional(),
  loop: z.string().transform(value => value === 'true').optional(),
  cond: z.string().optional(),
}).strict()

export async function playSoundEffectCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
