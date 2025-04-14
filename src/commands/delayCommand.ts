import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  speed: z.union([
    z.literal('nowait'),
    z.literal('user'),
    z.string()
      .transform(value => Number.parseFloat(value))
      .refine(value => !Number.isNaN(value), { message: 'Invalid number' }),
  ]),
}).strict()

export async function delayCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
