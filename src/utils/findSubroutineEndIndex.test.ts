import { describe, expect, it } from 'vitest'
import { findSubroutineEndIndex } from './findSubroutineEndIndex'

// filepath: src/utils/findSubroutineEndIndex.test.ts

describe('findSubroutineEndIndex', () => {
  it('should return the correct end index for a single subroutine', () => {
    const lines = [
      '*subroutine',
      'command1',
      'command2',
      '[s]',
    ]
    expect(findSubroutineEndIndex(0, lines)).toBe(3)
  })

  it('should return the correct end index for nested subroutines', () => {
    const lines = [
      '*subroutine1',
      'command1',
      '*subroutine2',
      'command2',
      '[return]',
      '[s]',
    ]
    expect(findSubroutineEndIndex(0, lines)).toBe(5)
  })

  it('should return -1 when there are no subroutines', () => {
    const lines = [
      'command1',
      'command2',
      'command3',
    ]
    expect(findSubroutineEndIndex(0, lines)).toBe(-1)
  })

  it('should return -1 when there is only a start but no end', () => {
    const lines = [
      '*subroutine',
      'command1',
      'command2',
    ]
    expect(findSubroutineEndIndex(0, lines)).toBe(2)
  })

  it('should return -1 when there is only an end but no start', () => {
    const lines = [
      'command1',
      'command2',
      '[s]',
    ]
    expect(findSubroutineEndIndex(0, lines)).toBe(-1)
  })

  it('should return -1 for an empty input', () => {
    const lines: string[] = []
    expect(findSubroutineEndIndex(0, lines)).toBe(-1)
  })
})
