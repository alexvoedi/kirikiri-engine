import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  output: z.string().transform(value => value === 'true').optional(),
  enabled: z.string().transform(value => value === 'true').optional(),
}).strict()

export async function historyCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.history.enabled = parsed.enabled ?? engine.history.enabled
  engine.history.output = parsed.output ?? engine.history.output
}
