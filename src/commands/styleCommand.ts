import type { KirikiriEngine } from '../classes/KirikiriEngine'
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
  schema.parse(props)

  engine.logger.warn(`Unimplemented command: style`)
}
