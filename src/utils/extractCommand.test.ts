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
      from: 0,
      to: 38,
    })
  })

  it('should handle a command line with no properties', () => {
    const line = '  [  command  ]  '
    const result = extractCommand(line)
    expect(result).toEqual({
      command: 'command',
      props: {},
      from: 2,
      to: 14,
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
      from: 0,
      to: 26,
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
      from: 0,
      to: 42,
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
      from: 0,
      to: 25,
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
      from: 0,
      to: 42,
    })
  })

  it('can extract the props of a command has special characters', () => {
    const line = '[playvideo storage="どれみ1015.mpg"]'
    const result = extractCommand(line)
    expect(result).toEqual({
      command: 'playvideo',
      props: {
        storage: 'どれみ1015.mpg',
      },
      from: 0,
      to: 32,
    })
  })

  it('should throw an error when the command line is empty', () => {
    const line = '[]'
    expect(() => extractCommand(line)).toThrowError()
  })

  it('should throw an error when the command is empty', () => {
    const line = '[   ]'
    expect(() => extractCommand(line)).toThrowError()
  })

  it('should work with commands that start with @', () => {
    const line = '@copy dx=0 dy=1 sx="2" sy="3" sw=4 sh=5'
    const result = extractCommand(line)
    expect(result).toEqual({
      command: 'copy',
      props: {
        dx: '0',
        dy: '1',
        sx: '2',
        sy: '3',
        sw: '4',
        sh: '5',
      },
      from: 0,
      to: 39,
    })
  })

  it('should extract the command at the given index', () => {
    const line = '[command key1=value1 key2="value2.jpg"][command2 key3=value3]'
    const result1 = extractCommand(line)
    const result2 = extractCommand(line, 39)
    expect(result1).toEqual({
      command: 'command',
      props: {
        key1: 'value1',
        key2: 'value2.jpg',
      },
      from: 0,
      to: 38,
    })
    expect(result2).toEqual({
      command: 'command2',
      props: {
        key3: 'value3',
      },
      from: 39,
      to: 60,
    })
  })
})
