import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas/zod'

const schema = z.object({
  color: z.union([
    z.literal('default'),
    z.string().regex(/^0x[0-9a-fA-F]{6}$/, 'Invalid color format'),
  ]).optional(),
  shadow: createBooleanSchema().optional(),
}).strict()

/**
 * Implements the `font` command.
 */
export async function fontCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.setFont(parsed)
}
