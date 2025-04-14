import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { IScriptParser } from '../classes/IScriptParser'

const schema = z.object({
}).strict()

export async function scriptCommand(engine: KirikiriEngine, lines: string[], props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  const context = {
    System: {
      shellExecute: () => null,
      exePath: undefined,
      inform: () => null,
      exit: () => null,
      readRegValue: () => null,
    },
    Storages: {
      getLocalName: () => null,
    },
    ...engine.globalScriptContext,
  }

  const x = new IScriptParser(context)

  const parsed = x.parse(lines.join('\n'))

  try {
    const result = x.run(parsed)

    return result
  }
  catch (e) {
    engine.logger.error('Error running script:', e)
  }
}
