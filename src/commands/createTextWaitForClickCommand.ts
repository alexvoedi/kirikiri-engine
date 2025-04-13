import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Waits for a click at the end of the current text line.
 */
export function createTextWaitForClickCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })
  }
}
