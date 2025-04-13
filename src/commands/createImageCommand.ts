import type { KirikiriEngine } from '../KirikiriEngine'
import Konva from 'konva'
import { z } from 'zod'

const schema = z.object({
  ggamma: z.string().transform(value => Number.parseFloat(value)).optional(),
  grayscale: z.string().transform(value => value === 'true').optional(),
  index: z.string().transform(value => Number.parseInt(value, 10)).pipe(z.number()).optional(),
  layer: z.string(),
  left: z.string().transform(value => Number.parseInt(value, 10)).pipe(z.number()).optional(),
  opacity: z.string().transform(value => Number.parseFloat(value)).pipe(z.number()).optional(),
  page: z.string().optional(),
  rgamma: z.string().transform(value => Number.parseFloat(value)).optional(),
  storage: z.string(),
  top: z.string().transform(value => Number.parseInt(value, 10)).pipe(z.number()).optional(),
  visible: z.string().transform(value => value === 'true').optional(),
}).strict()

/**
 * Returns a function that sets an image to the specified layer in konva.
 */
export function createImageCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

    const { layer, storage } = parsed

    const file = engine.getFullFilePath(`${storage}.png`)

    if (!file) {
      throw new Error(`File ${storage}.png not found in game files`)
    }

    Konva.Image.fromURL(file, (img) => {
      const existingLayer = engine.stage.getLayers().find(l => l.name() === layer)

      img.width(engine.stage.width())
      img.height(engine.stage.height())
      img.scaleX(1)
      img.scaleY(1)

      if (existingLayer) {
        // todo
      }
      else {
        const newLayer = new Konva.Layer({
          name: layer,
        })

        newLayer.add(img)

        engine.stage.add(newLayer)

        engine.stage.draw()
      }
    })
  }
}
