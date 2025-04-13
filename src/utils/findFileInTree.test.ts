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
  }

  it('should find a file without recursion', () => {
    const result = findFileInTree('README.md', mockTree, { recursive: false })
    expect(result).toEqual(['README.md'])
  })

  it('should find a file with recursion', () => {
    const result = findFileInTree('findFileInTree.ts', mockTree, { recursive: true })
    expect(result).toEqual(['src/utils/findFileInTree.ts'])
  })

  it('should find a file with case-insensitive search', () => {
    const result = findFileInTree('readme.md', mockTree, { recursive: true, ignoreCase: true })
    expect(result).toEqual(['README.md'])
  })

  it('should return an empty array if the file is not found', () => {
    const result = findFileInTree('nonexistent.ts', mockTree, { recursive: true })
    expect(result).toEqual([])
  })

  it('should return an empty array for an empty tree', () => {
    const result = findFileInTree('README.md', {}, { recursive: true })
    expect(result).toEqual([])
  })
})
