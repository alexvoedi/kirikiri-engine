import type { KirikiriEngine } from '../KirikiriEngine'
import { z } from 'zod'

const schema = z.object({
}).strict()

export function createCharacterPositionCommand(_: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    schema.parse({
      ...defaultProps,
      ...props,
    })

    // todo
  }
}
