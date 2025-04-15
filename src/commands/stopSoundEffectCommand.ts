import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  buf: z.string().optional(),
  cond: z.string().optional(),
}).strict()

export async function stopSoundEffectCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  engine.logger.warn('Unimplemented command', 'stopSoundEffectCommand')
}
