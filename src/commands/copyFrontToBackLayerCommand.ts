import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  layer: z.string().optional(),
}).strict()

/**
 * Implements the `backlay` command.
 */
export async function copyFrontToBackLayerCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.copyFrontToBack(parsed.layer)
}
