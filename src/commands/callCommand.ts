import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  storage: z.string(),
  target: z.string().optional(),
}).strict()

/**
 * Implements the `call` command.
 *
 * Runs a subroutine.
 *
 * Compared to the `jump` command, this will go back to the previous line after the subroutine is finished.
 */
export async function callCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  try {
    const file = engine.getFullFilePath(parsed.storage)

    if (!file) {
      throw new Error(`File ${parsed.storage} not found in game files`)
    }

    await engine.loadFileContent(file)

    if (parsed.target) {
      // TODO
    }
  }
  catch (error) {
    engine.logger.debug(`Error loading file ${parsed.storage}: ${error}`)
  }
}
