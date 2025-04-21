import { describe, expect, it } from 'vitest'
import { extractStorage } from './extractStorage'

describe('extractStorage', () => {
  it('should return null if there is no storage in the command', () => {
    const input = '[command]'
    const result = extractStorage(input)
    expect(result).toEqual(null)
  })

  it('should return the storage if it has no file extension', () => {
    const input = '[command storage="file"]'
    const result = extractStorage(input)
    expect(result).toEqual('file')
  })

  it('should return the storage if it has a file extension', () => {
    const input = '[command storage="file.png"]'
    const result = extractStorage(input)
    expect(result).toEqual('file.png')
  })

  it('should return null if it is not a command', () => {
    const input = 'not a command'
    const result = extractStorage(input)
    expect(result).toEqual(null)
  })

  it('should return null if it is not a regular command', () => {
    const input = '@not a command'
    const result = extractStorage(input)
    expect(result).toEqual(null)
  })

  it('should ignore placeholders', () => {
    const input = '[command storage=%storage]'
    const result = extractStorage(input)
    expect(result).toEqual(null)
  })
})
