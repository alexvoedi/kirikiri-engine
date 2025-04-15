import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  module: z.string(),
}).strict()

/**
 * Implements the `loadplugin` command.
 *
 * Loads a plugin file.
 */
export async function loadPluginCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  // we cannot load .dll files - we need to reimplement this
}
