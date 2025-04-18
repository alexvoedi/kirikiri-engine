import { describe, expect, it } from 'vitest'
import { getPlacholders } from './getPlaceholders'

// src/utils/getPlaceholders.test.ts

describe('getPlacholders', () => {
  it('should extract multiple valid placeholders', () => {
    const text = 'key1=%value1 key2=%value2 key3=%value3'
    const result = getPlacholders(text)
    expect(result).toEqual({
      key1: '%value1',
      key2: '%value2',
      key3: '%value3',
    })
  })

  it('should return an empty object if no placeholders are present', () => {
    const text = 'This is a test string without placeholders.'
    const result = getPlacholders(text)
    expect(result).toEqual({})
  })

  it('should return an empty object for an empty string', () => {
    const text = ''
    const result = getPlacholders(text)
    expect(result).toEqual({})
  })

  it('should ignore invalid placeholder formats', () => {
    const text = 'key1=value1 key2=%value2 key3=value3'
    const result = getPlacholders(text)
    expect(result).toEqual({
      key2: '%value2',
    })
  })

  it('should handle placeholders with special characters in keys or values', () => {
    const text = 'key_with_underscores=%value_with_underscores key123=%value123'
    const result = getPlacholders(text)
    expect(result).toEqual({
      key_with_underscores: '%value_with_underscores',
      key123: '%value123',
    })
  })
})
