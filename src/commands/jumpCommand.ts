import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.union([
  z.object({
    storage: z.string(),
  }).strict(),
  z.object({
    target: z.string(),
  }).strict(),
  z.object({
    /**
     * The script file to jump to. If omitted will jump to label in the current script.
     */
    storage: z.string(),
    /**
     * The to jump to. If omitted will jump to the start of the script.
     */
    target: z.string(),
  }).strict(),
])

export async function jumpCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  console.log(parsed, props)

  if ('storage' in parsed && 'target' in parsed) {
    const sanitizedTarget = parsed.target.replace(/^\*/, '')

    const lines = await engine.loadFile(parsed.storage)

    await engine.runLines(lines)

    await engine.runSubroutine(sanitizedTarget)
  }

  if ('storage' in parsed) {
    return
  }

  if ('target' in parsed) {
    const sanitizedTarget = parsed.target.replace(/^\*/, '')

    await engine.runSubroutine(sanitizedTarget)
  }
}
