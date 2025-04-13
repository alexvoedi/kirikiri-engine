import { describe, expect, it } from 'vitest'
import { checkIsBlockCommand } from './checkIsBlockCommand'

describe('checkIsBlockCommand', () => {
  it('should return true for a command that starts with a block command', () => {
    expect(checkIsBlockCommand('iscript')).toBe(true)
    expect(checkIsBlockCommand('endscript')).toBe(true)
    expect(checkIsBlockCommand('if')).toBe(true)
    expect(checkIsBlockCommand('macro')).toBe(true)
  })

  it('should return false for a command that does not start with a block command', () => {
    expect(checkIsBlockCommand('processStart')).toBe(false)
    expect(checkIsBlockCommand('taskBegin')).toBe(false)
    expect(checkIsBlockCommand('sessionEnd')).toBe(false)
    expect(checkIsBlockCommand('workFinish')).toBe(false)
  })

  it('should return false for an empty command', () => {
    expect(checkIsBlockCommand('')).toBe(false)
  })

  it('should return false for a command that partially matches a block command', () => {
    expect(checkIsBlockCommand('isc')).toBe(false)
    expect(checkIsBlockCommand('end')).toBe(false)
  })
})
