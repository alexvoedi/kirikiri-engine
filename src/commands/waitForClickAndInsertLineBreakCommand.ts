import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `l` command.
 *
 * Waits for a click and inserts a linebreak.
 */
export async function waitForClickAndInsertLineBreakCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  await engine.waitForGameClick()
  await engine.addCharacter('\n')
}
