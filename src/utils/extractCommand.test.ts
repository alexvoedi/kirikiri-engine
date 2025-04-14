import { describe, expect, it } from 'vitest'
import { extractCommand } from './extractCommand'

describe('extractCommand', () => {
  it('should extract the command and properties from a valid command line', () => {
    const line = '[command key1=value1 key2="value2.jpg"]'
    const result = extractCommand(line)
    expect(result).toEqual({
      command: 'command',
      props: {
        key1: 'value1',
        key2: 'value2.jpg',
      },
    })
  })

  it('should handle a command line with no properties', () => {
    const line = '[command]'
    const result = extractCommand(line)
    expect(result).toEqual({
      command: 'command',
      props: {},
    })
  })

  it('should throw an error for an invalid command line', () => {
    const line = 'invalid command line'
    expect(() => extractCommand(line)).toThrowError('Invalid command line: invalid command line')
  })

  it('should handle a command line with properties missing values', () => {
    const line = '[command key1=value1 key2=]'
    const result = extractCommand(line)
    expect(result).toEqual({
      command: 'command',
      props: {
        key1: 'value1',
      },
    })
  })

  it('should handle a command line with extra spaces', () => {
    const line = '[  command   key1="value1"   key2=value2  ]'
    const result = extractCommand(line)
    expect(result).toEqual({
      command: 'command',
      props: {
        key1: 'value1',
        key2: 'value2',
      },
    })
  })

  it('can extract the props of an if command', () => {
    const line = '[if exp="sf.waitCnt==100"]'
    const result = extractCommand(line)
    expect(result).toEqual({
      command: 'if',
      props: {
        exp: 'sf.waitCnt==100',
      },
    })
  })

  it('can extract the props of a complex if command', () => {
    const line = '[if exp="sf.waitCnt==50 || sf.waitCnt==10"]'
    const result = extractCommand(line)
    expect(result).toEqual({
      command: 'if',
      props: {
        exp: 'sf.waitCnt==50 || sf.waitCnt==10',
      },
    })
  })
})
