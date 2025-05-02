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
 * Jumps to a label. Will replace the current callstack.
 */
export async function jumpCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  if ('storage' in parsed && 'target' in parsed) {
    const label = parsed.target.replace(/^\*/, '')

    const result = await engine.loadFile(parsed.storage, label)

    engine.callstack.replace(result)
  }

  if ('storage' in parsed) {
    const result = await engine.loadFile(parsed.storage)

    engine.callstack.replace(result)
  }

  if ('target' in parsed) {
    const label = parsed.target.replace(/^\*/, '')

    engine.callstack.current.index = engine.labels[engine.callstack.current.file][label]
  }
}
