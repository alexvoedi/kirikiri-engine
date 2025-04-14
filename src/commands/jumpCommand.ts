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

  if ('storage' in parsed && 'target' in parsed) {
    const jumpPoints = engine.jumpPoints[parsed.storage]

    if (!jumpPoints) {
      // ignore
      return
      throw new Error(`Jump point not found: ${parsed.storage}`)
    }

    const lines = await engine.loadFile(parsed.storage)

    const newJumpPoints = await engine.runLines(lines, jumpPoints[parsed.target])
    engine.jumpPoints[parsed.storage] = newJumpPoints
  }

  if ('storage' in parsed) {
    console.log('storage')
    return
  }

  if ('target' in parsed) {
    console.log('target')
  }
}
