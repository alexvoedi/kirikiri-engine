import type { KirikiriEngine } from '../KirikiriEngine'
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

export function createDelayCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    schema.parse({
      ...defaultProps,
      ...props,
    })

    // todo
  }
}
