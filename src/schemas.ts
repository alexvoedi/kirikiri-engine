import type { ZodTypeDef } from 'zod'
import { z } from 'zod'
import { scaleRange } from './utils/scaleRange'

export function createBooleanSchema(): z.Schema<boolean, ZodTypeDef, string | boolean> {
  return z.union([z.enum(['true', 'false']), z.boolean()]).transform((value) => {
    if (typeof value === 'boolean') {
      return value
    }

    return value === 'true'
  })
}

export function createIntegerSchema(min?: number, max?: number): z.ZodSchema<number> {
  return z.coerce.number()
    .refine(value => Number.isInteger(value), { message: 'Value must be an integer' })
    .refine(value => !Number.isNaN(value), { message: 'Value must be a number' })
    .refine(value => min !== undefined ? value >= min : true, { message: `Value must be greater than or equal to ${min}` })
    .refine(value => max !== undefined ? value <= max : true, { message: `Value must be less than or equal to ${max}` })
}

export function createFloatSchema(min?: number, max?: number): z.ZodSchema<number> {
  return z.coerce.number()
    .refine(value => !Number.isNaN(value), { message: 'Value must be a number' })
    .refine(value => min !== undefined ? value >= min : true, { message: `Value must be greater than or equal to ${min}` })
    .refine(value => max !== undefined ? value <= max : true, { message: `Value must be less than or equal to ${max}` })
}

export function createGammaSchema() {
  return createFloatSchema(0.1, 9.9).transform(v => scaleRange(v, 0.1, 9.9, 0, 255))
}

export function createPageSchema() {
  return z.enum(['fore', 'back'])
}
