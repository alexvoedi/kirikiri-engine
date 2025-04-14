import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'
import { createPageSchema } from '../schemas/zod'

const schema = z.object({
  layer: z.string(),
  page: createPageSchema().optional(),
}).strict()

export async function releaseLayerImageCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
