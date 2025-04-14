import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { IScriptParser } from '../classes/IScriptParser'
import { GLOBALS } from '../constants'

export async function checkCondition(engine: KirikiriEngine, expression: string) {
  const context = {
    ...GLOBALS,
    ...engine.globalScriptContext,
  }

  const parser = new IScriptParser(context)

  const parsedCondition = parser.parse(expression)

  try {
    const result = await parser.run(parsedCondition)

    return result
  }
  catch (e) {
    engine.logger.error('Error in condition:', e)
    return false
  }
}
