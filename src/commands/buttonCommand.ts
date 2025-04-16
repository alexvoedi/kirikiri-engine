import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { createBooleanSchema } from '../schemas/zod'
import { jumpCommand } from './jumpCommand'

const schema = z.object({
  graphic: z.string(),
  target: z.string().optional(),
  recthit: createBooleanSchema().optional(),
  exp: z.string().optional(),
  cond: z.string().optional(),
}).strict()

export async function buttonCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const callback = async () => {
    if (parsed.target) {
      await jumpCommand(engine, {
        target: parsed.target,
      })
    }
  }

  await engine.renderer.addButton({
    file: engine.getFullFilePath(parsed.graphic),
    callback,
  })
}
