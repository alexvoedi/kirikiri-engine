import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { removeFileExtension } from '../utils/removeFileExtension'

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

export async function jumpCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  if ('storage' in parsed && 'target' in parsed) {
    const subroutine = parsed.target.replace(/^\*/, '')

    return await engine.runSubroutine(subroutine, {
      file: removeFileExtension(parsed.storage),
    })
  }

  if ('storage' in parsed) {
    return
  }

  if ('target' in parsed) {
    const subroutine = parsed.target.replace(/^\*/, '')

    return await engine.runSubroutine(subroutine)
  }
}
