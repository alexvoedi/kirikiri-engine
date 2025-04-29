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

  return new Promise((resolve) => {
    window.addEventListener('click', async () => {
      await engine.addCharacter('\n')
      resolve()
    }, { once: true })
  })
}
