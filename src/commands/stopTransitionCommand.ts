import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({}).strict()

/**
 * Implements the `stoptrans` command.
 *
 * Stops a current transition immediately and goes to the final state.
 */
export async function stopTransitionCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  window.dispatchEvent(new CustomEvent(EngineEvent.STOP_TRANSITION))
}
