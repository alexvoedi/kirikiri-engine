import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas/zod'

const schema = z.object({
  enabled: createBooleanSchema(),
}).strict()

/**
 * Implements the `clickskip` command.
 *
 * When enabled, text can be shown immediately by clicking the mouse.
 */
export async function clickSkipCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    clickskip: parsed,
  })
}
