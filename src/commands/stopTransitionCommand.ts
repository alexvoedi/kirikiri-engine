import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({}).strict()

/**
 * Implements the `stoptrans` command.
 */
export async function stopTransitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  window.dispatchEvent(new CustomEvent(EngineEvent.STOP_TRANSITION))
}
