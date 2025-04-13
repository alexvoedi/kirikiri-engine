import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Stops the execution of the current scenario (started by a `*` command)
 */
export function createScenarioExitCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })
  }
}
