import { describe, expect, it } from 'vitest'
import { checkIsCommand } from './checkIsCommand'

// filepath: /home/alex/repos/kirikiri-engine/src/utils/checkIsCommand.test.ts

describe('checkIsCommand', () => {
  it('should return true for a line starting with "[" and ending with "]"', () => {
    const line = '[command]'
    expect(checkIsCommand(line)).toBe(true)
  })

  it('should return true for a line starting with "@"', () => {
    const line = '@command'
    expect(checkIsCommand(line)).toBe(false)
  })

  it('should return false for a line not starting with "[" or "@"', () => {
    const line = 'command'
    expect(checkIsCommand(line)).toBe(false)
  })

  it('should return false for a line starting with "[" but not ending with "]"', () => {
    const line = '[command'
    expect(checkIsCommand(line)).toBe(false)
  })

  it('should return false for a line ending with "]" but not starting with "["', () => {
    const line = 'command]'
    expect(checkIsCommand(line)).toBe(false)
  })

  it('should return false for an empty string', () => {
    const line = ''
    expect(checkIsCommand(line)).toBe(false)
  })

  it('should return false for a single character that is not "[" or "@"', () => {
    const line = 'a'
    expect(checkIsCommand(line)).toBe(false)
  })

  it('should return false for a single character "[" and "]"', () => {
    const line = '[]'
    expect(checkIsCommand(line)).toBe(false)
  })

  it('should return false for a single character "@"', () => {
    const line = '@'
    expect(checkIsCommand(line)).toBe(false)
  })
})
