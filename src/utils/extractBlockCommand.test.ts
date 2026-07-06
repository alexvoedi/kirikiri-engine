import { describe, expect, it } from 'vitest'
import { extractBlockCommand } from './extractBlockCommand'

describe('extractBlockCommand', () => {
  it('should find the closing command index in a simple case', () => {
    const lines = [
      '[if]',
      '[endif]',
    ]

    const result = extractBlockCommand('if', lines, 0)

    expect(result).toStrictEqual({
      from: {
        line: 0,
        col: 0,
      },
      to: {
        line: 1,
        col: 6,
      },
      content: [],
    })
  })

  it('should throw an error if there is no closing command', () => {
    const lines = [
      '[if]',
      'test',
    ]

    expect(() => extractBlockCommand('if', lines, 0)).toThrowError()
  })

  it('should throw an error if the command is not a block command', () => {
    const lines = [
      '[wait]',
      'test',
    ]

    expect(() => extractBlockCommand('wait', lines, 0)).toThrowError()
  })

  it('should find the closing command index in a nested case', () => {
    const lines = [
      '[if]',
      'test',
      '[if]',
      'test',
      '[endif]',
      'test',
      '[endif]',
    ]

    const result = extractBlockCommand('if', lines, 0)

    expect(result).toStrictEqual({
      from: {
        line: 0,
        col: 0,
      },
      to: {
        line: 6,
        col: 6,
      },
      content: [
        'test',
        '[if]',
        'test',
        '[endif]',
        'test',
      ],
    })
  })

  it('should find the closing command index in a single line case', () => {
    const lines = [
      '[if] test [endif]',
    ]

    const result = extractBlockCommand('if', lines, 0)

    expect(result).toStrictEqual({
      from: {
        line: 0,
        col: 0,
      },
      to: {
        line: 0,
        col: 16,
      },
      content: [
        ' test ',
      ],
    })
  })

  it('should find the closing command index in a single line with nested commands', () => {
    const lines = [
      '[if] test [if] test [endif] test [endif]',
    ]

    const result = extractBlockCommand('if', lines, 0)

    expect(result).toStrictEqual({
      from: {
        line: 0,
        col: 0,
      },
      to: {
        line: 0,
        col: 39,
      },
      content: [
        ' test [if] test [endif] test ',
      ],
    })

    const result2 = extractBlockCommand('if', lines, 10)

    expect(result2).toStrictEqual({
      from: {
        line: 0,
        col: 10,
      },
      to: {
        line: 0,
        col: 26,
      },
      content: [
        ' test ',
      ],
    })
  })

  it('should find a single-line if block with multiple command tags and a trailing continuation marker', () => {
    const lines = [
      '[if exp="f.re_scenario==0"][rclick enabled=true][history enabled=false][endif]\\',
    ]

    const result = extractBlockCommand('if', lines, 0)

    expect(result).toStrictEqual({
      from: {
        line: 0,
        col: 0,
      },
      to: {
        line: 0,
        col: 77,
      },
      content: [
        '[rclick enabled=true][history enabled=false]',
      ],
    })
  })

  it('accepts endfif as an endif alias for shipped scripts', () => {
    const lines = [
      '[if exp="sf.waitCnt<10"][jump target=*alpharom][endfif]\\',
    ]

    const result = extractBlockCommand('if', lines, 0)

    expect(result).toStrictEqual({
      from: {
        line: 0,
        col: 0,
      },
      to: {
        line: 0,
        col: 54,
      },
      content: [
        '[jump target=*alpharom]',
      ],
    })
  })
})
