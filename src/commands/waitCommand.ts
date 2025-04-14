import type { KirikiriEngine } from '../classes/KirikiriEngine'
import z from 'zod'

const schema = z.object({
  time: z.string()
    .transform(value => Number.parseFloat(value))
    .refine(value => !Number.isNaN(value), { message: 'Invalid number for \'time\'' }),
  canskip: z.string().transform(value => value === 'true').optional(),
  mode: z.enum(['normal', 'until']).optional(),
  cond: z.string().optional(),
}).strict()

/**
 * Waits for the specified amount of milliseconds.
 *
 * The difference between `normal` and `until` is that `normal` will wait in all cases for the specified amount of time, while `until` will for the remaining time since the last `resetwait` command.
 */
export async function waitCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)


  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, parsed.time)
  })
}
