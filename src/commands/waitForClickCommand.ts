import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({}).strict()

/**
 * Implements the `waitclick` command.
 *
 * Waits for a click.
 */
export async function waitForClickCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  const onClick = () => {
    engine.globalScriptContext.kag.clickCount++

    window.dispatchEvent(new Event(EngineEvent.TEXT_CLICK))
    window.removeEventListener('click', onClick)
  }

  window.addEventListener('click', onClick)

  return new Promise((resolve) => {
    window.addEventListener(EngineEvent.TEXT_CLICK, () => {
      window.removeEventListener('click', onClick)
      resolve()
    })
  })
}
