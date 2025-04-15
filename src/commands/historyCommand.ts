import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'

const schema = z.object({
  output: z.string().transform(value => value === 'true').optional(),
  enabled: z.string().transform(value => value === 'true').optional(),
}).strict()

export async function historyCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    history: parsed,
  })
}
