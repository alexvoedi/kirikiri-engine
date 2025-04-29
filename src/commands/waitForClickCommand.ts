import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `waitclick` command.
 *
 * Waits for a click.
 */
export async function waitForClickCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  return new Promise((resolve) => {
    window.addEventListener('click', () => {
      engine.globalScriptContext.kag.clickCount++
      resolve()
    }, { once: true })
  })
}
