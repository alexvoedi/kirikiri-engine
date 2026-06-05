import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas'

const schema = z.object({
  enabled: createBooleanSchema().optional().default(true),
}).strict()

/**
 * Implements the `startanchor` command.
 *
 * This is the point where the engine goes to when the "Go to Menu" function is called.
 */
export async function startanchorCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    startanchor: {
      enabled: parsed.enabled,
      file: parsed.enabled ? engine.callstack.current.file : undefined,
      index: parsed.enabled ? engine.callstack.current.index : undefined,
    },
  })
}
