import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  time: createIntegerSchema(),
  hmax: createIntegerSchema().optional().default(10),
  vmax: createIntegerSchema().optional().default(10),
}).strict()

/**
 * Implements the `quake` command.
 *
 * Triggers a quake effect on the screen.
 */
export async function quakeCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.quake(parsed)
}
