import type { KirikiriEngine } from '../KirikiriEngine'

/**
 * Loads a plugin file.
 */
export function createLoadPluginCommand(_: KirikiriEngine, __?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (_?: Record<string, string>): Promise<void> => {
    // ignore
  }
}
