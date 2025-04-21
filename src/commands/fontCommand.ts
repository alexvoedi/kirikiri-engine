import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas'

const schema = z.object({
  color: z.union([
    z.literal('default'),
    z.string().regex(/^0x[0-9a-fA-F]{6}$/, 'Invalid color format'),
  ]).optional(),
  shadow: z.union([createBooleanSchema(), z.literal('default'), z.literal('no')]).optional(),
}).strict()

/**
 * Implements the `font` command.
 *
 * Sets the font options for the text renderer.
 */
export async function fontCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.setFont(parsed)
}
