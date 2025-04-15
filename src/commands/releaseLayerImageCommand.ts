import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createAlphanumericSchema, createPageSchema } from '../schemas/zod'

const schema = z.object({
  layer: createAlphanumericSchema(),
  page: createPageSchema().optional(),
}).strict()

/**
 * Implements the 'freeimage' command.
 *
 * Removes the image from the specified layer.
 */
export async function releaseLayerImageCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  engine.renderer.clearLayer(parsed.layer, parsed.page)
}
