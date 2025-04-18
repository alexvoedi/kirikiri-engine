import { describe, expect, it } from 'vitest'
import { UnknownCommandError } from '../errors/UnknownCommandError'
import { delayCommand } from './delayCommand'
import { getCommand } from './getCommand'

describe('getCommand', () => {
  it('should return the correct command function for a valid command', () => {
    const command = 'delay'
    const result = getCommand(command)
    expect(result).toBe(delayCommand)
  })

  it('should throw an UnknownCommandError for an invalid command', () => {
    const invalidCommand = 'invalidCommand'
    expect(() => getCommand(invalidCommand)).toThrow(UnknownCommandError)
  })
})
