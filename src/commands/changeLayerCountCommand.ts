import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createFloatSchema } from '../schemas'

const schema = z.object({
  layers: createFloatSchema(),
  messages: createFloatSchema().optional(),
}).strict()

export async function changeLayerCountCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  // do we need this?
  engine.logger.warn('Unimplemented command', 'changeLayerCountCommand')
}
