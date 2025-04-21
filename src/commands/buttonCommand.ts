import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas'
import { jumpCommand } from './jumpCommand'

const schema = z.object({
  graphic: z.string(),
  target: z.string().optional(),
  recthit: createBooleanSchema().optional(),
  exp: z.string().optional(),
  cond: z.string().optional(),
}).strict()

/**
 * Implements the `button` command.
 *
 * Create a button on the screen that can be clicked to perform an action.
 */
export async function buttonCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const callback = async () => {
    if (parsed.target) {
      await jumpCommand(engine, {
        target: parsed.target,
      })
    }
    else {
      throw new Error('No target specified for button command')
    }
  }

  await engine.renderer.addButton({
    file: engine.getFullFilePath(parsed.graphic),
    callback,
  })
}
