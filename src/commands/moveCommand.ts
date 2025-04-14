import type { KirikiriEngine } from '../classes/KirikiriEngine'
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

export async function moveCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
