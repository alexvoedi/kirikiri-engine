import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  storage: z.string(),
  target: z.string().optional(),
}).strict()

/**
 * Calls a script file.
 */
export async function callCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  try {
    const file = engine.getFullFilePath(parsed.storage)

    if (!file) {
      throw new Error(`File ${parsed.storage} not found in game files`)
    }

    await engine.loadFile(file)

    if (parsed.target) {
      await engine.runSubroutine(parsed.target)
    }
  }
  catch (error) {
    engine.logger.debug(`Error loading file ${parsed.storage}: ${error}`)
  }
}
