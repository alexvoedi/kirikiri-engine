import { describe, expect, it } from 'vitest'
import { findClosingBlockCommandIndex } from './findClosingBlockCommandIndex'

describe('findClosingBlockCommandIndex', () => {
  let lines: string[] = []

  beforeAll(() => {
    lines = [
      '[mock]',
      '[macro name=cwt]',
      '[eval exp="kag.keyDownHook.add(myKeyDownHook)"]',
      '[macro]',
      'mock',
      '[endmacro]',
      '[if]',
      '[eval exp="kag.keyDownHook.remove(myKeyDownHook)"]',
      '[endif]',
      '[endmacro]',
      '[mock]',
    ]
  })

  it('should find the closing command index', () => {
    const result1 = findClosingBlockCommandIndex('macro', 1, lines)
    expect(result1).toBe(9)

    const result2 = findClosingBlockCommandIndex('if', 6, lines)
    expect(result2).toBe(8)

    const result3 = findClosingBlockCommandIndex('macro', 3, lines)
    expect(result3).toBe(5)
  })

  it('should return -1 if no closing block command is found', () => {
    const result = findClosingBlockCommandIndex('iscript', 0, lines)

    expect(result).toBe(-1)
  })

  it('should throw and error if it is not a block command', () => {
    expect(() => findClosingBlockCommandIndex('mock', 3, lines)).toThrowError()
  })

  it('should find the index if the command block is empty', () => {
    const result = findClosingBlockCommandIndex('iscript', 0, ['[iscript]', '[endscript]'])
    expect(result).toBe(1)
  })
})
