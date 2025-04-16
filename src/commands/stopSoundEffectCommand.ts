import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({
  buf: z.string().optional(),
  cond: z.string().optional(),
}).strict()

/**
 * Implements the `stopse` command.
 *
 * Stops a sound effect.
 */
export async function stopSoundEffectCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  window.dispatchEvent(new CustomEvent(EngineEvent.STOP_SE))
}
