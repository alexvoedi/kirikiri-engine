import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  x: createIntegerSchema().optional(),
  y: createIntegerSchema().optional(),
}).strict()

/**
 * Implements the `locate` command.
 */
export async function characterPositionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.setNextElementPosition(parsed.x, parsed.y)
}
