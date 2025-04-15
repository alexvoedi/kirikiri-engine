import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { createIntegerSchema } from '../schemas/zod'

const schema = z.object({
  speed: z.union([
    z.literal('nowait'),
    z.literal('user'),
    createIntegerSchema(),
  ]),
}).strict()

export async function delayCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    deplay: parsed,
  })
}
