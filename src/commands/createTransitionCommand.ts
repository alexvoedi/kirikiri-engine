import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  time: z.string()
    .transform(value => Number.parseFloat(value))
    .refine(value => !Number.isNaN(value), value => ({ message: `Invalid number for 'time': ${value}` })),
  method: z.enum(['universal', 'scroll', 'crossfade', 'turn', 'rotatezoom']).optional(),
  bgcolor: z.string().optional(),
  factor: z.string()
    .transform(value => Number.parseFloat(value))
    .refine(value => !Number.isNaN(value), { message: 'Invalid number for \'factor\'' })
    .optional(),
  storage: z.string().optional(),
  rule: z.string().optional(),
  vague: z.string().optional(),
}).strict()

export function createTransitionCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    schema.parse({
      ...defaultProps,
      ...props,
    })

    // todo
  }
}
