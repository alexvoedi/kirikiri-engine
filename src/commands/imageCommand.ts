import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema, createGammaSchema, createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  ggamma: createGammaSchema().optional(),
  grayscale: createBooleanSchema().optional(),
  index: createIntegerSchema().default(0).optional(),
  layer: z.string(),
  left: createIntegerSchema().optional(),
  opacity: createIntegerSchema(0, 255).optional(),
  page: z.enum(['back', 'fore']).optional().default('fore'),
  rgamma: createGammaSchema().optional(),
  storage: z.string(),
  top: createIntegerSchema().optional(),
  visible: createBooleanSchema().optional().default(true),
  bgamma: createGammaSchema().optional(),
}).strict()

/**
 * Implementation of the `image` command.
 *
 * Returns a function that sets an image to the specified layer.
 */
export async function imageCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const file = engine.getFullFilePath(parsed.storage)

  if (!file) {
    throw new Error(`File ${parsed.storage}.png not found in game files`)
  }

  await engine.renderer.setImage({
    file,
    ...parsed,
  })
}
