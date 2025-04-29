import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas'

const schema = z.object({
  output: createBooleanSchema().optional(),
  enabled: createBooleanSchema().optional(),
}).strict()

/**
 * Implements the `history` command.
 *
 * Sets options for the message history.
 */
export async function historyCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    history: parsed,
  })
}
