import type { KirikiriEngine } from '../KirikiriEngine'
import z from 'zod'

const schema = z.object({
  time: z.string()
    .transform(value => Number.parseFloat(value))
    .refine(value => !Number.isNaN(value), { message: 'Invalid number for \'time\'' }),
  canskip: z.string().transform(value => value === 'true').optional(),
  mode: z.enum(['normal', 'until']).optional(),
}).strict()

export function createWaitCommand(_: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, parsed.time)
    })
  }
}
