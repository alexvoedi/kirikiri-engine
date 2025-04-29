import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `p` command.
 *
 * Waits for a click after showing text and inserts a page break.
 *
 * A page break is indicated by a special symbol that is visible in the message layer like an arrow.
 */
export async function waitForTextClickWithPageBreakCommand(_: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  return new Promise((resolve) => {
    window.addEventListener('click', () => {
      resolve()
    }, { once: true })
  })
}
