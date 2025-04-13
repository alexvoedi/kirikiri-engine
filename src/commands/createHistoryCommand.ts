import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  output: z.string().transform(value => value === 'true').optional(),
  enabled: z.string().transform(value => value === 'true').optional(),
}).strict()

export function createHistoryCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

    engine.history.enabled = parsed.enabled ?? engine.history.enabled
    engine.history.output = parsed.output ?? engine.history.output
  }
}
