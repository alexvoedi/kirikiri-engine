import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({}).strict()

/**
 * Implements the `stopvideo` command.
 */
export async function stopVideoCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  if (engine.commandStorage.video?.playing) {
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.STOP_VIDEO))
    return
  }

  engine.commandStorage.video?.cleanup?.()
}
