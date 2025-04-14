import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  exp: z.string(),
}).strict()

/**
 * Evaluates the expression and replaces the tag with the result.
 */
export function createEmbeddedTagCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

    // todo
  }
}
