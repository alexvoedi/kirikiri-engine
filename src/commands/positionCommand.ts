import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  layer: z.string().optional(),
  page: z.enum(['fore', 'back']).optional(),
  left: z.string().transform(value => Number.parseInt(value, 10)).pipe(z.number()).optional(),
  top: z.string().transform(value => Number.parseInt(value, 10)).pipe(z.number()).optional(),
  width: z.string().transform(value => Number.parseInt(value, 10)).pipe(z.number()).optional(),
  height: z.string().transform(value => Number.parseInt(value, 10)).pipe(z.number()).optional(),
  visible: z.string().transform(value => value === 'true').optional(),
  frame: z.string().optional(),
  opacity: z.string().transform(value => Number.parseInt(value, 10)).pipe(z.number().min(0).max(255)).optional(),
}).strict()

export async function positionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
