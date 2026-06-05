import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createBooleanSchema } from '../schemas'
import { checkCondition } from '../utils/checkCondition'

const schema = z.object({
  canskip: createBooleanSchema().optional(),
  cond: z.string().optional(),
}).strict()

/**
 * Implements the `wm` command.
 *
 * Waits for a move instruction to finish.
 */
export async function waitForMoveCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const isConditionMet = parsed.cond ? await checkCondition(engine, parsed.cond) : true

  const moving = engine.commandStorage.move?.moving ?? false

  return new Promise((resolve) => {
    if (!isConditionMet || !moving) {
      resolve()
    }
    else {
      const handleMoveEnded = () => {
        merge(engine.commandStorage, {
          move: {
            moving: false,
          },
        })
        resolve()
      }

      globalThis.addEventListener(EngineEvent.MOVE_ENDED, handleMoveEnded, { once: true })
    }
  })
}
