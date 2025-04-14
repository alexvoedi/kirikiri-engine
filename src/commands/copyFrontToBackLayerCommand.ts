import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({}).strict()

export async function copyFrontToBackLayerCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
