import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  layer: z.string(),
  page: z.enum(['fore', 'back']),
  visible: z.string().transform(value => value === 'true').optional(),
  autohide: z.string().transform(value => value === 'true').optional(),
  index: z.string().transform(value => Number.parseInt(value, 10)).optional(),
}).strict()

export async function layerOptionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
