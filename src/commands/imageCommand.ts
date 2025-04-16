import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema, createGammaSchema, createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  ggamma: createGammaSchema().optional(),
  grayscale: createBooleanSchema().optional(),
  /**
   * ???
   */
  index: createIntegerSchema().default(0).optional(),
  /**
   * The name of the layer of the image. `base` is the background layer. All other values are layers in the foreground.
   */
  layer: z.union([z.literal('base'), createIntegerSchema(0)]),
  left: createIntegerSchema().optional(),
  opacity: createIntegerSchema(0, 255).optional(),
  /**
   * Every image has two layers - back and fore. These two layers are used for transitions.
   */
  page: z.enum(['back', 'fore']).optional(),
  rgamma: createGammaSchema().optional(),
  storage: z.string(),
  top: createIntegerSchema().optional(),
  visible: createBooleanSchema().default(false).optional(),
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
    layer: parsed.layer,
    page: parsed.page ?? 'back',
    opacity: parsed.opacity,
    x: parsed.left,
    y: parsed.top,
    visible: parsed.visible,
  })
}
