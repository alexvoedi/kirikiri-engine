import type { KirikiriEngine } from '../KirikiriEngine'

/**
 * Evaluates an expression
 */
export function createEvalCommand(_: KirikiriEngine, __?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (_?: Record<string, string>): Promise<void> => {
    // ignore
  }
}
