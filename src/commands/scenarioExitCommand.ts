import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `s` command.
 *
 * Stops the execution of the current scenario (started by a `*` command)
 */
export async function scenarioExitCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
