import { describe, expect, it } from 'vitest'
import { scaleRange } from './scaleRange'

describe('scaleRange', () => {
  it('should scale a value within the range correctly', () => {
    expect(scaleRange(5, 0, 10, 0, 100)).toBe(50)
  })

  it('should return the minimum output value when input is at inMin', () => {
    expect(scaleRange(0, 0, 10, 0, 100)).toBe(0)
  })

  it('should return the maximum output value when input is at inMax', () => {
    expect(scaleRange(10, 0, 10, 0, 100)).toBe(100)
  })

  it('should throw an error if the value is below inMin', () => {
    expect(() => scaleRange(-1, 0, 10, 0, 100)).toThrow(
      'Value -1 is out of range [0, 10]',
    )
  })

  it('should throw an error if the value is above inMax', () => {
    expect(() => scaleRange(11, 0, 10, 0, 100)).toThrow(
      'Value 11 is out of range [0, 10]',
    )
  })

  it('should handle fractional scaling correctly', () => {
    expect(scaleRange(2.5, 0, 10, 0, 100)).toBe(25)
  })

  it('should handle negative ranges correctly', () => {
    expect(scaleRange(-5, -10, 0, -100, 0)).toBe(-50)
  })
})
