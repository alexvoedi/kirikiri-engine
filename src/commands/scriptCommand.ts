import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { IScriptParser } from '../classes/IScriptParser'
import { GLOBALS } from '../constants'

const schema = z.object({
}).strict()

/**
 * Implements the `script` command.
 *
 * Executes a script in the context of the game engine.
 */
export async function scriptCommand(engine: KirikiriEngine, lines: string[], props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  const context = {
    ...GLOBALS,
    ...engine.globalScriptContext,
  }

  const parser = new IScriptParser(context)

  const parsed = parser.parse(lines.join('\n'))

  try {
    return await parser.run(parsed)
  }
  catch (e) {
    engine.logger.error('Error running script:', e)
  }
}
