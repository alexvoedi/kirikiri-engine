import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

/**
 * Implements the `l` command.
 *
 * Waits for a click.
 */
export async function waitForTextClickCommand(_: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  return new Promise((resolve) => {
    const onClick = () => {
      window.removeEventListener('click', onClick)
      resolve()
    }
    window.addEventListener('click', onClick)
  })
}
