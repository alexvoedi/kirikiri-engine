import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { checkCondition } from '../utils/checkCondition'

const schema = z.object({
  exp: z.string(),
  lines: z.array(z.string()),
}).strict()

export async function ifCommand(engine: KirikiriEngine, props?: Record<string, unknown>): Promise<void> {
  const parsed = schema.parse(props)

  const result = await checkCondition(engine, parsed.exp)

  if (result) {
    await engine.runLines(parsed.lines)
  }
}
