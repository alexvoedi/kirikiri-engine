import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'lodash'
import { z } from 'zod'
import { createIntegerSchema } from '../schemas/zod'
import { transformMoveInstruction } from '../utils/transformMoveInstruction'

const schema = z.object({
  layer: z.string(),
  time: createIntegerSchema(),
  path: z.string().transform(transformMoveInstruction),
}).strict()

/**
 * Implements the `move` command.
 */
export async function moveCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  return new Promise((resolve) => {
    merge(engine.commandStorage, {
      move: {
        moving: true,
      },
    })

    engine.renderer.moveAndChangeOpacity(parsed)

    resolve()
  })
}
