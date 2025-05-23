import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { createIntegerSchema } from '../schemas'

const schema = z.object({
  speed: z.union([
    z.literal('nowait'),
    z.literal('user'),
    createIntegerSchema(),
  ]),
}).strict()

/**
 * Implements the `delay` command.
 *
 * Sets the delay for the next character when outputting text.
 */
export async function delayCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    delay: parsed,
  })
}
