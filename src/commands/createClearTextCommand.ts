import { z } from "zod";
import { KirikiriEngine } from "../KirikiriEngine";

const schema = z.object({}).strict()

export function createClearTextCommand(engine: KirikiriEngine, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

  }
}
