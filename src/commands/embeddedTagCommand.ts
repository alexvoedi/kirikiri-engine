import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { IScriptParser } from '../classes/IScriptParser'
import { GLOBALS } from '../constants'

const schema = z.object({
  exp: z.string(),
}).strict()

/**
 * Implements the `emb` command.
 */
export async function embeddedTagCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  const context = {
    ...GLOBALS,
    ...engine.globalScriptContext,
  }

  const parser = new IScriptParser(context)
  const parsedExpression = parser.parse(parsed.exp)

  try {
    const result = await parser.run(parsedExpression)
    const text = result === null || result === undefined ? '' : String(result)

    for (const character of text) {
      engine.renderer.addCharacterToText(character, engine.commandStorage.indent?.enabled)
    }
  }
  catch (error) {
    engine.logger.error('Error in embedded expression:', error)
  }
}
