import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `l` command.
 *
 * Waits for a click after showing text.
 */
export async function waitForTextClickCommand(_: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  return new Promise((resolve) => {
    window.addEventListener('click', () => {
      resolve()
    }, { once: true })
  })
}
