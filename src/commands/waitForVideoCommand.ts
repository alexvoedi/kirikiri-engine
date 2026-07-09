import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createBooleanSchema } from '../schemas'

const schema = z.object({
  canskip: createBooleanSchema().optional(),
}).strict()

/**
 * Implements the `wv` command.
 *
 * Waits for video playback to finish, optionally allowing a click to skip.
 */
export async function waitForVideoCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const playing = engine.commandStorage.video?.playing ?? false

  return new Promise((resolve) => {
    if (!playing) {
      resolve()
      return
    }

    function onEnded() {
      globalThis.removeEventListener(EngineEvent.CLICK, onClick)
      resolve()
    }

    function onClick() {
      engine.globalScriptContext.kag.clickCount += 1
      globalThis.removeEventListener(EngineEvent.VIDEO_ENDED, onEnded)
      resolve()
    }

    globalThis.addEventListener(EngineEvent.VIDEO_ENDED, onEnded, { once: true })

    if (parsed.canskip) {
      globalThis.addEventListener(EngineEvent.CLICK, onClick, { once: true })
    }
  })
}
