import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  graphic: z.string(),
  target: z.string().optional(),
  recthit: z.string().transform(value => value === 'true').optional(),
}).strict()

export function createButtonCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

    // todo
  }
}
