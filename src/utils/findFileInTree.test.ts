import type { FileTree } from 'src/types/FileTree'
import { describe, expect, it } from 'vitest'
import { findFileInTree } from './findFileInTree'

describe('findFileInTree', () => {
  const mockTree: FileTree = {
    'src': {
      utils: {
        'findFileInTree.ts': null,
        'findFileInTree.test.ts': null,
      },
    },
    'README.md': null,
    'docs': {
      'index.md': null,
      'images': {
        'logo.png': null,
        'screenshot.png': null,
      },
    },
    'script': {
      '08. other': {
        'menu.ks': null,
      },
    },
    'videos': {
      'どれみ1015.mp4': null,
    },
  }

  it('should find a file without recursion', () => {
    const result = findFileInTree('README.md', mockTree)
    expect(result).toEqual(['README.md'])
  })

  it('should find a file with recursion', () => {
    const result = findFileInTree('findFileInTree.ts', mockTree)
    expect(result).toEqual(['src/utils/findFileInTree.ts'])
  })

  it('should find a file with case-insensitive search', () => {
    const result = findFileInTree('readme.md', mockTree)
    expect(result).toEqual(['README.md'])
  })

  it('should return an empty array if the file is not found', () => {
    const result = findFileInTree('nonexistent.ts', mockTree)
    expect(result).toEqual([])
  })

  it('should return an empty array for an empty tree', () => {
    const result = findFileInTree('README.md', {})
    expect(result).toEqual([])
  })

  it('can find files in directories with spaces', () => {
    const result = findFileInTree('menu.ks', mockTree)
    expect(result).toEqual(['script/08. other/menu.ks'])
  })

  it('can find with special characters', () => {
    const result = findFileInTree('どれみ1015.mpg', mockTree)
    expect(result).toEqual(['videos/どれみ1015.mp4'])
  })
})
