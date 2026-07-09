import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createBooleanSchema } from '../schemas'

const schema = z.object({
  canskip: createBooleanSchema().optional(),
}).strict()

/**
 * Implements the `wfgzoom` command.
 *
 * Waits for the pending fgzoom timing window to complete.
 */
export async function waitForFgZoomCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  const zooming = engine.commandStorage.fgzoom?.zooming ?? false

  return new Promise((resolve) => {
    if (!zooming) {
      resolve()
      return
    }

    globalThis.addEventListener(EngineEvent.FGZOOM_ENDED, () => {
      resolve()
    }, { once: true })
  })
}
