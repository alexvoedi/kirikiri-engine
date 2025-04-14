import { describe, expect, it } from 'vitest'
import { splitMultiCommandLine } from './splitMultiCommandLine'

// src/utils/splitMultiCommandLine.test.ts

describe('splitMultiCommandLine', () => {
  it('should split a line with multiple commands', () => {
    const line = '[if exp="kag.clickCount!=0"][jump target=*buttontest][endif]'
    const result = splitMultiCommandLine(line)
    expect(result).toEqual([
      '[if exp="kag.clickCount!=0"]',
      '[jump target=*buttontest]',
      '[endif]',
    ])
  })

  it('should return a single command if only one exists', () => {
    const line = '[jump target=*start]'
    const result = splitMultiCommandLine(line)
    expect(result).toEqual(['[jump target=*start]'])
  })

  it('should return the line if there are no commands', () => {
    const line = 'if( sf.d1_s==void )	sf.d1_s=0;	// test'
    const result = splitMultiCommandLine(line)
    expect(result).toEqual([line])
  })

  it('should handle an empty string', () => {
    const line = ''
    const result = splitMultiCommandLine(line)
    expect(result).toEqual([])
  })

  it('should work with scripts', () => {
    const line = '[iscript]print("Hello, World!")[endscript]'
    const result = splitMultiCommandLine(line)
    expect(result).toEqual([
      '[iscript]',
      'print("Hello, World!")',
      '[endscript]',
    ])
  })
})
