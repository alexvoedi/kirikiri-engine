import { describe, expect, it } from 'vitest'
import { transformMoveInstruction } from './transformMoveInstruction'

// filepath: /home/alex/repos/kirikiri-engine/src/utils/transformMoveInstruction.test.ts

describe('transformMoveInstruction', () => {
  it('should correctly transform a valid move instruction string with multiple points', () => {
    const input = '(10,20,30) (40,50,60) (70,80,90)'
    const expected = [
      { x: 10, y: 20, opacity: 30 / 255 },
      { x: 40, y: 50, opacity: 60 / 255 },
      { x: 70, y: 80, opacity: 90 / 255 },
    ]
    expect(transformMoveInstruction(input)).toEqual(expected)
  })

  it('should correctly transform a valid move instruction string with a single point', () => {
    const input = '(10,20,30)'
    const expected = [{ x: 10, y: 20, opacity: 30 / 255 }]
    expect(transformMoveInstruction(input)).toEqual(expected)
  })

  it('should throw an error for an invalid move instruction string', () => {
    const input = '(10,20) (40,50,60)'
    expect(() => transformMoveInstruction(input)).toThrowError(
      'Invalid path format: (10,20)',
    )
  })

  it('should throw an error for an empty string', () => {
    const input = ''
    expect(() => transformMoveInstruction(input)).toThrowError(
      'Invalid path format: ',
    )
  })

  it('should correctly handle negative numbers and zero values', () => {
    const input = '(0,0,0) (-10,-20,-30)'
    const expected = [
      { x: 0, y: 0, opacity: 0 },
      { x: -10, y: -20, opacity: -30 / 255 },
    ]
    expect(transformMoveInstruction(input)).toEqual(expected)
  })

  it('should throw an error for malformed points', () => {
    const input = '(10,20,30) (40,50)'
    expect(() => transformMoveInstruction(input)).toThrowError(
      'Invalid path format: (40,50)',
    )
  })

  it('should throw an error for points with extra values', () => {
    const input = '(10,20,30,40)'
    expect(() => transformMoveInstruction(input)).toThrowError(
      'Invalid path format: (10,20,30,40)',
    )
  })
})
