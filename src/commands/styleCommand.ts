import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
  align: z.enum(['left', 'right', 'center', 'top', 'bottom', 'default']).optional(),
}).strict()

export async function styleCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)
}
