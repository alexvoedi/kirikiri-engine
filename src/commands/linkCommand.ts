import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { jumpCommand } from './jumpCommand'

const schema = z.object({
  storage: z.string().optional(),
  target: z.string().optional(),
}).strict()

export type LinkCommandProps = z.infer<typeof schema>

/**
 * Implements the `link` command.
 *
 * A link is a text fragment that can be clicked to jump to a subroutine.
 */
export async function linkCommand(engine: KirikiriEngine, lines: string[], props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  if (lines.length > 1) {
    throw new Error('Link command must be on a single line')
  }

  const text = lines[0]

  if (engine.commandStorage.link?.choices) {
    engine.commandStorage.link.choices.push({
      text,
      data: parsed,
    })
  }

  engine.renderer.addLink(text, async () => {
    const { ...jumpData } = parsed
    await jumpCommand(engine, jumpData)
  })

  window.addEventListener(EngineEvent.CHOICE, () => {
    engine.commandStorage.link = {}
  }, { once: true })
}
