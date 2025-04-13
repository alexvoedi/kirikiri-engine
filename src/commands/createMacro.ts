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
    macro: async (props: Record<string, string>) => {
      commands.forEach((command, index) => {
        if (placeholders[index]) {
          const requiredProps = {}

          Object.entries(placeholders[index]).forEach(([key, value]) => {
            props[key] = value
          })

          command(requiredProps)
        }
      })
    },
  }
}
