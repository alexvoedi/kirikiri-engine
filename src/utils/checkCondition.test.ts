import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { describe, expect, it } from 'vitest'
import { checkCondition } from './checkCondition'

describe('checkCondition', () => {
  const mockEngine = {} as KirikiriEngine

  it('should return false for an invalid condition', async () => {
    const script = '3 == 4'
    const result = await checkCondition(mockEngine, script)
    expect(result).toBe(false)
  })

  it('should use the correct context for the parser', async () => {
    const script = '3 == 3'
    const result = await checkCondition(mockEngine, script)
    expect(result).toBe(true)
  })
})
