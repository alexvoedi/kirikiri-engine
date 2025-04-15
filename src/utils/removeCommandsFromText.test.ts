import { describe, expect, it } from 'vitest'
import { removeCommandsFromText } from './removeCommandsFromText'

describe('removeCommandsFromText', () => {
  it('should return the same text if there are no commands', () => {
    const text = 'this is a text without commands'
    const result = removeCommandsFromText(text)
    expect(result).toStrictEqual({
      text,
      commands: {},
    })
  })

  it('should remove a single command from the text', () => {
    const text = 'this is a text with a command [command1 key1=value1 key2=value2] and more text'
    const result = removeCommandsFromText(text)
    expect(result).toStrictEqual({
      text: 'this is a text with a command and more text',
      commands: {
        30: [{
          startIndex: 30,
          endIndex: 63,
          command: 'command1',
          props: { key1: 'value1', key2: 'value2' },
        }],
      },
    })
  })

  it('should remove multiple commands from the text', () => {
    const text = 'this [a x=y] is [b k=m] a text with multiple commands'
    const result = removeCommandsFromText(text)
    expect(result).toStrictEqual({
      text: 'this is a text with multiple commands',
      commands: {
        5: [{
          startIndex: 5,
          endIndex: 11,
          command: 'a',
          props: { x: 'y' },
        }],
        8: [{
          startIndex: 8,
          endIndex: 14,
          command: 'b',
          props: { k: 'm' },
        }],
      },
    })
  })

  it('should handle commands at the start of the text', () => {
    const text = '[start key=value] this is a text'
    const result = removeCommandsFromText(text)
    expect(result).toStrictEqual({
      text: 'this is a text',
      commands: {
        0: [{
          startIndex: 0,
          endIndex: 16,
          command: 'start',
          props: { key: 'value' },
        }],
      },
    })
  })

  it('should handle commandsf at the end of the text', () => {
    const text = 'this is a text [end key=value]'
    const result = removeCommandsFromText(text)
    expect(result).toStrictEqual({
      text: 'this is a text',
      commands: {
        15: [{
          startIndex: 15,
          endIndex: 29,
          command: 'end',
          props: { key: 'value' },
        }],
      },
    })
  })

  it('should handle commands at the end of the text', () => {
    const text = '魔女Ａ　「[indent]ほらそこ、しっかりしなさい！」[endindent][wait2 time=2000]'
    const result = removeCommandsFromText(text)
    expect(result).toStrictEqual({
      text: '魔女Ａ　「ほらそこ、しっかりしなさい！」',
      commands: {
        5: [
          {
            startIndex: 5,
            endIndex: 12,
            command: 'indent',
            props: {},
          },
        ],
        20: [
          {
            startIndex: 20,
            endIndex: 30,
            command: 'endindent',
            props: {},
          },
          {
            startIndex: 20,
            endIndex: 36,
            command: 'wait2',
            props: {
              time: '2000',
            },
          },
        ],
      },
    })
  })
})
