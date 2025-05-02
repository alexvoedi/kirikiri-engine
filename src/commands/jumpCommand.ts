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
     * The subroutine to jump to. If omitted will jump to the start of the script.
     */
    target: z.string(),
  }).strict(),
])

/**
 * Implements the `jump` command.
 *
 * Jumps to a label.
 */
export async function jumpCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  if ('storage' in parsed && 'target' in parsed) {
    const label = parsed.target.replace(/^\*/, '')

    await engine.loadFile(parsed.storage, label)
  }

  if ('storage' in parsed) {
    return
  }

  if ('target' in parsed) {
    const label = parsed.target.replace(/^\*/, '')

    engine.callstack[engine.callstack.length - 1].index = engine.labels[engine.callstack[engine.callstack.length - 1].file][label]
  }
}
