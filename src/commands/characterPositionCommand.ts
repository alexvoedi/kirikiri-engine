import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  x: createIntegerSchema().optional(),
  y: createIntegerSchema().optional(),
}).strict()

export async function characterPositionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
