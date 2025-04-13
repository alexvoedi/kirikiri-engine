import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  lines: z.array(z.string()),
})

export async function createMacro(engine: KirikiriEngine, props: Record<string, unknown>) {
  const parsed = schema.parse(props)

  const { commands, placeholders } = await engine.processLines(parsed.lines)

  return {
    name: parsed.name,
    macro: async (props: Record<string, string>): Promise<void> => {
      await Promise.all(
        commands.map(async (command, index) => {
          if (placeholders[index]) {
            const requiredProps: Record<string, string> = {}

            Object.keys(placeholders[index]).forEach((key) => {
              requiredProps[key] = props[key]
            })

            await command(requiredProps)
          }
        }),
      )
    },
  }
}
