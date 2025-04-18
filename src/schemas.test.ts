import { createBooleanSchema, createFloatSchema, createGammaSchema, createIntegerSchema, createPageSchema } from './schemas'

describe('createBooleanSchema', () => {
  it('should return true for "true"', () => {
    const schema = createBooleanSchema()
    expect(schema.parse('true')).toBe(true)
  })

  it('should return false for "false"', () => {
    const schema = createBooleanSchema()
    expect(schema.parse('false')).toBe(false)
  })

  it('should return true for true', () => {
    const schema = createBooleanSchema()
    expect(schema.parse(true)).toBe(true)
  })

  it('should return false for false', () => {
    const schema = createBooleanSchema()
    expect(schema.parse(false)).toBe(false)
  })
})

describe('createIntegerSchema', () => {
  it('should return a valid integer', () => {
    const schema = createIntegerSchema()
    expect(schema.parse('5')).toBe(5)
  })

  it('should throw an error for non-integer values', () => {
    const schema = createIntegerSchema()
    expect(() => schema.parse('5.5')).toThrow()
  })

  it('should throw an error for NaN', () => {
    const schema = createIntegerSchema()
    expect(() => schema.parse('abc')).toThrow()
  })

  it('should throw an error for values less than min', () => {
    const schema = createIntegerSchema(10)
    expect(() => schema.parse(5)).toThrow()
  })

  it('should throw an error for values greater than max', () => {
    const schema = createIntegerSchema(undefined, 10)
    expect(() => schema.parse(15)).toThrow()
  })
})

describe('createFloatSchema', () => {
  it('should return a valid float', () => {
    const schema = createFloatSchema()
    expect(schema.parse('5.5')).toBe(5.5)
  })

  it('should throw an error for non-numeric values', () => {
    const schema = createFloatSchema()
    expect(() => schema.parse('abc')).toThrow()
  })

  it('should throw an error for NaN', () => {
    const schema = createFloatSchema()
    expect(() => schema.parse('abc')).toThrow()
  })

  it('should throw an error for values less than min', () => {
    const schema = createFloatSchema(10)
    expect(() => schema.parse(5)).toThrow()
  })

  it('should throw an error for values greater than max', () => {
    const schema = createFloatSchema(undefined, 10)
    expect(() => schema.parse(15)).toThrow()
  })
})

describe('createGammaSchema', () => {
  it('should return a valid gamma value for the min possible value', () => {
    const schema = createGammaSchema()
    expect(schema.parse('0.1')).toBe(0)
  })

  it('should return a valid gamma value for the max possible value', () => {
    const schema = createGammaSchema()
    expect(schema.parse('9.9')).toBe(255)
  })

  it('should throw an error for non-numeric values', () => {
    const schema = createGammaSchema()
    expect(() => schema.parse('abc')).toThrow()
  })

  it('should throw if the value is too high', () => {
    const schema = createGammaSchema()
    expect(() => schema.parse(10)).toThrow()
  })

  it('should throw if the value is too low', () => {
    const schema = createGammaSchema()
    expect(() => schema.parse(0)).toThrow()
  })
})

describe('createPageSchema', () => {
  it('should return "fore" for "fore"', () => {
    const schema = createPageSchema()
    expect(schema.parse('fore')).toBe('fore')
  })

  it('should return "back" for "back"', () => {
    const schema = createPageSchema()
    expect(schema.parse('back')).toBe('back')
  })

  it('should throw an error for invalid values', () => {
    const schema = createPageSchema()
    expect(() => schema.parse('invalid')).toThrow()
  })
})
