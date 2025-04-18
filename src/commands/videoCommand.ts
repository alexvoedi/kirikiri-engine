import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { createBooleanSchema, createIntegerSchema } from '../schemas'

const schema = z.object({
  visible: createBooleanSchema().optional(),
  left: createIntegerSchema().optional(),
  top: createIntegerSchema().optional(),
  width: createIntegerSchema().optional(),
  height: createIntegerSchema().optional(),
}).strict()

/**
 * Implements the `video` command.
 *
 * Sets the video properties.
 */
export async function videoCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    video: parsed,
  })
}
