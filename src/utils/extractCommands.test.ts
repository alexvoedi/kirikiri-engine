import { describe, expect, it } from 'vitest'
import { extractCommands } from './extractCommands'

describe('extractCommands', () => {
  it('should parse a single command with no properties', () => {
    const input = '[command]'
    const result = extractCommands(input)
    expect(result).toEqual({
      length: 9,
      commands: [
        { command: 'command', props: {} },
      ],
    })
  })

  it('should parse a single command with multiple properties', () => {
    const input = '[command key1=value1 key2=value2]'
    const result = extractCommands(input)
    expect(result).toEqual({
      length: 33,
      commands: [
        { command: 'command', props: { key1: 'value1', key2: 'value2' } },
      ],
    })
  })

  it('should parse multiple commands in a single string', () => {
    const input = '[command1 key1=value1][command2 key2=value2]'
    const result = extractCommands(input)
    expect(result).toEqual({
      length: 44,
      commands: [
        { command: 'command1', props: { key1: 'value1' } },
        { command: 'command2', props: { key2: 'value2' } },
      ],
    })
  })

  it('should throw an error for unmatched opening bracket', () => {
    const input = '[command key1=value1'
    expect(() => extractCommands(input)).toThrowError('Unmatched [ at index 0')
  })

  it('should return an empty array for empty input', () => {
    const input = ''
    const result = extractCommands(input)
    expect(result).toEqual({
      length: 0,
      commands: [],
    })
  })

  it('should handle invalid property formats gracefully', () => {
    const input = '[command key1=value1 invalidProp]'
    const result = extractCommands(input)
    expect(result).toEqual({
      length: 33,
      commands: [
        { command: 'command', props: { key1: 'value1', invalidProp: undefined } },
      ],
    })
  })

  it('should parse commands with spaces in properties', () => {
    const input = '[command key1="value 1" key2=value2]'
    const result = extractCommands(input)
    expect(result).toEqual({
      length: 36,
      commands: [
        { command: 'command', props: { key1: 'value 1', key2: 'value2' } },
      ],
    })
  })

  it('should parse commands if there are other letters behind the commands', () => {
    const input = '[command key1=value1]def'
    const result = extractCommands(input)
    expect(result).toEqual({
      length: 21,
      commands: [
        { command: 'command', props: { key1: 'value1' } },
      ],
    })
  })

  it('should work if there are whitespaces between the commands', () => {
    const input = '[command key1=value1] [command2 key2=value2] test'
    const result = extractCommands(input)
    expect(result).toEqual({
      length: 44,
      commands: [
        { command: 'command', props: { key1: 'value1' } },
        { command: 'command2', props: { key2: 'value2' } },
      ],
    })
  })
})
