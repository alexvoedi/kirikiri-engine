import type { KirikiriEngine } from '../KirikiriEngine'
import Konva from 'konva'
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
 * Returns a function that sets an image to the specified layer in konva.
 */
export function createImageCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

    const file = engine.getFullFilePath(`${parsed.storage}.png`)

    if (!file) {
      throw new Error(`File ${parsed.storage}.png not found in game files`)
    }

    Konva.Image.fromURL(file, (img) => {
      const globalLayer = parsed.layer === 'base' ? engine.layers.background : engine.layers.foreground

      /**
       * The group consists of the `fore` and the `back`. `fore` is hidden by default. This is used for transitions.
       */
      let group = globalLayer.children.find((child): child is Konva.Group => child.name() === parsed.layer.toString() && child.getType() === 'Group')

      if (!group) {
        group = new Konva.Group({
          name: parsed.layer.toString(),
        })

        const back = new Konva.Group({
          name: 'back',
        })
        group.add(back)

        const fore = new Konva.Group({
          name: 'fore',
        })
        group.add(fore)

        globalLayer.add(group)
      }

      const [back, fore] = group.children as [Konva.Group, Konva.Group]

      const currentGroup = parsed.layer === 'base' ? back : fore

      img.setAttrs({
        x: parsed.left,
        y: parsed.top,
        opacity: parsed.opacity,
        visible: parsed.visible,
        width: engine.stage.width(),
        height: engine.stage.height(),
        scaleX: 1,
        scaleY: 1,
      })

      img.cache()

      const filters = [Konva.Filters.RGB]
      if (parsed.grayscale) {
        filters.push(Konva.Filters.Grayscale)
      }
      img.filters(filters)

      img.red(parsed.rgamma ?? 255)
      img.green(parsed.ggamma ?? 255)
      img.blue(parsed.bgamma ?? 255)

      currentGroup.add(img)

      engine.lastImageProps.unshift({
        layer: parsed.layer,
        page: parsed.page ?? 'fore',
      })
    })
  }
}
