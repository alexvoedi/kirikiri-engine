import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implement the `resetwait` command.
 *
 * The next `wait` command that follows will wait until the specified time since the last `resetwait` command.
 */
export async function resetWaitCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  engine.commandStorage.resetWait = {
    timestamp: Date.now(),
  }
}
