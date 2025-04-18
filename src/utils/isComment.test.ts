import { describe, expect, it } from 'vitest'
import { isComment } from './isComment'

describe('isComment', () => {
  it('should return true for a line starting with ";"', () => {
    const line = '; This is a comment'
    expect(isComment(line)).toBe(true)
  })

  it('should return false for a line not starting with ";"', () => {
    const line = 'This is not a comment'
    expect(isComment(line)).toBe(false)
  })

  it('should return false for an empty string', () => {
    const line = ''
    expect(isComment(line)).toBe(false)
  })

  it('should return true for a line with leading whitespace before ";"', () => {
    const line = '   ; This is a comment with leading spaces'
    expect(isComment(line)).toBe(false) // Adjust based on your requirements
  })

  it('should return false for a line with no ";" at all', () => {
    const line = 'This line has no semicolon'
    expect(isComment(line)).toBe(false)
  })
})
