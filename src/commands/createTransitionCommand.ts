import type Konva from 'konva'
import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  time: z.string()
    .transform(value => Number.parseFloat(value))
    .refine(value => !Number.isNaN(value), value => ({ message: `Invalid number for 'time': ${value}` })),
  method: z.enum(['universal', 'scroll', 'crossfade', 'turn', 'rotatezoom']).optional(),
  bgcolor: z.string().optional(),
  factor: z.string()
    .transform(value => Number.parseFloat(value))
    .refine(value => !Number.isNaN(value), { message: 'Invalid number for \'factor\'' })
    .optional(),
  storage: z.string().optional(),
  rule: z.string().optional(),
  vague: z.string().optional(),
}).strict()

export function createTransitionCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    schema.parse({
      ...defaultProps,
      ...props,
    })

    const to = engine.lastImageProps[1]

    const from = engine.lastImageProps.find((imageProps, index) => index !== 0 && imageProps.layer === to.layer)

    if (!from) {
      throw new Error(`No image found for layer ${to.layer}`)
    }

    if (from.layer === 'base') {
      const result = engine.layers.background.getChildren().find((child): child is Konva.Group => child.name() === from.layer.toString())
    }
    else {
      const layer = engine.layers.foreground.getChildren().find((child): child is Konva.Group => child.name() === from.layer.toString())

      if (!layer) {
        throw new Error(`Layer ${from.layer} not found`)
      }

      console.log(engine.lastImageProps)

      const fromLayer = from.page === 'back' ? layer.children[0] : layer.children[1]
      const toLayer = to.page === 'back' ? layer.children[0] : layer.children[1]

      console.log(fromLayer.name(), toLayer.name())
    }
  }
}
