import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  layer: z.string(),
  time: z.string().transform(value => Number.parseInt(value, 10)).optional(),
  path: z.string().transform((value) => {
    return value.split(' ').map((point) => {
      const match = point.match(/^\(([-\d]+),([-\d]+),([-\d]+)\)$/)
      if (!match) {
        throw new Error(`Invalid path format: ${point}`)
      }
      const [, x, y, opacity] = match
      return { x: Number(x), y: Number(y), opactiy: Number(opacity) }
    })
  }),
}).strict()

export function createLayerMoveCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

    // todo
  }
}
