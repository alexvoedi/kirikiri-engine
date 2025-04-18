import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas'

const schema = z.object({
  call: createBooleanSchema().optional(),
  jump: createBooleanSchema().optional(),
  target: z.string().optional(),
  storage: z.string().optional(),
  enabled: createBooleanSchema().optional(),
}).strict()

/**
 * Implements the `rclick` command.
 *
 * Does something when the right mouse button is clicked.
 */
export async function rightClickCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    rclick: parsed,
  })
}
