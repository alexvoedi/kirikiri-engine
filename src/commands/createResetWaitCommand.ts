import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 *
 */
export function createResetWaitCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    schema.parse({
      ...defaultProps,
      ...props,
    })
  }
}
