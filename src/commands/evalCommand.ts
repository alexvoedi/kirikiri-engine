import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { IScriptParser } from '../classes/IScriptParser'
import { GLOBALS } from '../constants'

const schema = z.object({
  exp: z.string(),
}).strict()

/**
 * Evaluates an expression
 */
export async function evalCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const context = {
    ...GLOBALS,
    ...engine.globalScriptContext,
  }

  const parser = new IScriptParser(context)

  const parsedCondition = parser.parse(parsed.exp)

  try {
    await parser.run(parsedCondition)
  }
  catch (e) {
    engine.logger.error('Error in condition:', e)
  }
}
