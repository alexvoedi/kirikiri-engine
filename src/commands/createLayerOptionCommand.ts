import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  layer: z.string(),
  page: z.enum(['fore', 'back']),
  visible: z.string().transform(value => value === 'true').optional(),
  autohide: z.string().transform(value => value === 'true').optional(),
  index: z.string().transform(value => Number.parseInt(value, 10)).optional(),
}).strict()

export function createLayerOptionCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

    // todo
  }
}
