import { z } from 'zod'
import { scaleRange } from '../utils/scaleRange'

export function createBooleanSchema(): z.ZodSchema<boolean> {
  return z.coerce.boolean()
}

export function createIntegerSchema(min?: number, max?: number): z.ZodSchema<number> {
  const schema = z.coerce.number()
    .refine(value => Number.isInteger(value), { message: 'Value must be an integer' })
    .refine(value => !Number.isNaN(value), { message: 'Value must be a number' })

  if (min !== undefined) {
    schema.pipe(schema.refine(value => value >= min, { message: `Value must be greater than or equal to ${min}` }))
  }

  if (max !== undefined) {
    schema.pipe(schema.refine(value => value <= max, { message: `Value must be less than or equal to ${max}` }))
  }

  return schema
}

export function createFloatSchema(min?: number, max?: number): z.ZodSchema<number> {
  const schema = z.coerce.number()
    .refine(value => !Number.isNaN(value), { message: 'Value must be a number' })

  if (min !== undefined) {
    schema.pipe(schema.refine(value => value >= min, { message: `Value must be greater than or equal to ${min}` }))
  }

  if (max !== undefined) {
    schema.pipe(schema.refine(value => value <= max, { message: `Value must be less than or equal to ${max}` }))
  }

  return schema
}

export function createGammaSchema() {
  return createFloatSchema(0.1, 9.9).transform(v => scaleRange(v, 0.1, 9.9, 0, 255))
}

export function createPageSchema() {
  return z.enum(['fore', 'back'])
}

/**
 * Can be a string or a number. If it is string that can be converted to a number, it will be converted.
 */
export function createAlphanumericSchema() {
  return z.union([
    z.string().transform((value) => {
      const num = Number(value)
      return Number.isNaN(num) ? value : num
    }),
    z.number(),
  ]).refine((value) => {
    if (typeof value === 'string') {
      return /^[\w.]+$/.test(value)
    }
    return true
  }, { message: 'Value must be alphanumeric' })
}
