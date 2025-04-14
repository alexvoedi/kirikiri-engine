import { describe, expect, it } from 'vitest'
import { sanitizeLine } from './sanitizeLine'

describe('sanitizeLine', () => {
  it('should remove leading and trailing whitespace', () => {
    const input = '   hello world   '
    const output = sanitizeLine(input)
    expect(output).toBe('hello world')
  })

  it('should handle strings with no modifications needed', () => {
    const input = 'hello world'
    const output = sanitizeLine(input)
    expect(output).toBe('hello world')
  })

  it('should handle empty strings', () => {
    const input = ''
    const output = sanitizeLine(input)
    expect(output).toBe('')
  })
})
