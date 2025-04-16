import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  graphic: z.string(),
  target: z.string().optional(),
  recthit: z.string().transform(value => value === 'true').optional(),
  cond: z.string().optional(),
}).strict()

export async function buttonCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  engine.logger.warn('Unimplemented command', 'buttonCommand')
}
