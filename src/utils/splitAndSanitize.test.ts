import { describe, it } from 'vitest'
import { splitAndSanitize } from './splitAndSanitize'

describe('splitAndSanitize', () => {
  it('should remove comments', () => {
    const content = `
      line1
      ;this is a comment
      line2
      line3
    `

    const result = splitAndSanitize(content)

    expect(result).toEqual([
      'line1',
      'line2',
      'line3',
    ])
  })

  it('should split multi-command lines', () => {
    const content = `
      [command1][command2][command3]
      line3
    `

    const result = splitAndSanitize(content)

    expect(result).toEqual([
      '[command1]',
      '[command2]',
      '[command3]',
      'line3',
    ])
  })

  it('should remove empty lines', () => {
    const content = `
      line1

      line2

      line3
    `

    const result = splitAndSanitize(content)

    expect(result).toEqual([
      'line1',
      'line2',
      'line3',
    ])
  })
})
