import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  cond: z.string().optional(),
  buf: z.string().optional(),
}).strict()

export async function waitForSoundEffectCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
