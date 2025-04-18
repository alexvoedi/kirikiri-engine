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
      'snippet': null,
      'images': {
        'logo': null,
        'logo.png': null,
        'logo.ks': null,
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

  it('should find a file in the root path', () => {
    const result = findFileInTree('README.md', mockTree)
    expect(result).toEqual('README.md')
  })

  it('should find file in a directory', () => {
    const result = findFileInTree('findFileInTree.ts', mockTree)
    expect(result).toEqual('src/utils/findFileInTree.ts')
  })

  it('should find a file with case-insensitive search', () => {
    const result = findFileInTree('readme.md', mockTree)
    expect(result).toEqual('README.md')
  })

  it('should return an empty array if the file is not found', () => {
    const result = findFileInTree('nonexistent.ts', mockTree)
    expect(result).toEqual(undefined)
  })

  it('should return an empty array for an empty tree', () => {
    const result = findFileInTree('README.md', {})
    expect(result).toEqual(undefined)
  })

  it('can find files in directories with spaces', () => {
    const result = findFileInTree('menu.ks', mockTree)
    expect(result).toEqual('script/08. other/menu.ks')
  })

  it('can find with special characters', () => {
    const result = findFileInTree('どれみ1015.mpg', mockTree)
    expect(result).toEqual('videos/どれみ1015.mp4')
  })

  it('finds the more specific file if multiple are available', () => {
    expect(findFileInTree('index', mockTree)).toEqual('docs/index.md')
    expect(findFileInTree('snippet.md', mockTree)).toEqual('docs/snippet')
    expect(findFileInTree('logo', mockTree)).toEqual('docs/images/logo')
    expect(findFileInTree('logo.png', mockTree)).toEqual('docs/images/logo.png')
    expect(findFileInTree('logo.ks', mockTree)).toEqual('docs/images/logo.ks')
  })
})
