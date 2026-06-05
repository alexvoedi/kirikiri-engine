import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'

const schema = z.object({
  align: z.enum(['left', 'right', 'center', 'top', 'bottom', 'default']).optional(),
}).strict()

/**
 * Implements the `style` command.
 *
 * Applies a style to message layers.
 */
export async function styleCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    style: parsed,
  })

  engine.renderer.setStyle(parsed)
}
