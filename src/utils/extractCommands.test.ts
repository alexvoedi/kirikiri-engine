import { describe, expect, it } from 'vitest'
import { extractCommands } from './extractCommands'

// filepath: /home/alex/repos/kirikiri-engine/src/utils/extractCommands.test.ts

describe('extractCommands', () => {
  it('should work with a text without commands', () => {
    const text = 'this is a text without commands'
    const result = extractCommands(text)
    expect(result).toEqual({})
  })

  it('should work with a text with one command', () => {
    const text = 'this is a text with a command [command1 key1=value1 key2=value2] and even more text'
    const result = extractCommands(text)
    expect(result).toEqual({
      0: {
        startIndex: 30,
        endIndex: 63,
        command: 'command1',
        props: {
          key1: 'value1',
          key2: 'value2',
        },
      },
    })
  })
})
