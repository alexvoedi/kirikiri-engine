import { describe, expect, it } from 'vitest'
import { extractCommands } from './extractCommands'

describe('extractCommands', () => {
  it('should parse a single command with no properties', () => {
    const input = '[command]'
    const result = extractCommands(input)
    expect(result).toEqual([
      { command: 'command', props: {}, from: 0, to: 8 },
    ])
  })

  it('should parse a single command with multiple properties', () => {
    const input = '[command key1=value1 key2=value2]'
    const result = extractCommands(input)
    expect(result).toEqual([
      { command: 'command', props: { key1: 'value1', key2: 'value2' }, from: 0, to: 32 },
    ])
  })

  it('should parse multiple commands in a single string', () => {
    const input = '[command1 key1=value1][command2 key2=value2]'
    const result = extractCommands(input)
    expect(result).toEqual([
      { command: 'command1', props: { key1: 'value1' }, from: 0, to: 21 },
      { command: 'command2', props: { key2: 'value2' }, from: 22, to: 43 },
    ])
  })

  it('should throw an error for unmatched opening bracket', () => {
    const input = '[command key1=value1'
    expect(() => extractCommands(input)).toThrowError()
  })

  it('should return an empty array for empty input', () => {
    const input = ''
    const result = extractCommands(input)
    expect(result).toEqual([])
  })

  it('should handle invalid property formats gracefully', () => {
    const input = '[command key1=value1 invalidProp]'
    const result = extractCommands(input)
    expect(result).toEqual([
      { command: 'command', props: { key1: 'value1', invalidProp: undefined }, from: 0, to: 32 },
    ])
  })

  it('should parse commands with spaces in properties', () => {
    const input = '[command key1="value 1" key2=value2]'
    const result = extractCommands(input)
    expect(result).toEqual([
      { command: 'command', props: { key1: 'value 1', key2: 'value2' }, from: 0, to: 35 },
    ])
  })

  it('should parse commands if there are other letters behind the commands', () => {
    const input = '[command key1=value1]def'
    const result = extractCommands(input)
    expect(result).toEqual([
      { command: 'command', props: { key1: 'value1' }, from: 0, to: 20 },
    ])
  })

  it('should work if there are whitespaces between the commands', () => {
    const input = '[command key1=value1] [command2 key2=value2] test'
    const result = extractCommands(input)
    expect(result).toEqual([
      { command: 'command', props: { key1: 'value1' }, from: 0, to: 20 },
      { command: 'command2', props: { key2: 'value2' }, from: 22, to: 43 },
    ])
  })
})
