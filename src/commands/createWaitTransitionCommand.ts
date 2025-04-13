import { z } from 'zod'

const schema = z.object({
  canskip: z.string().transform(value => value === 'true').optional(),
})

export function createWaitTransitionCommand(_: unknown, defaultProps?: Record<string, string>): (props?: Record<string, string>) => Promise<void> {
  return async (props?: Record<string, string>): Promise<void> => {
    const parsed = schema.parse({
      ...defaultProps,
      ...props,
    })

    // nothing to do
  }
}
