import { describe, expect, it } from 'vitest'
import { removeFileExtension } from './removeFileExtension'

describe('removeFileExtension', () => {
  it('should remove the file extension from a string with a single dot', () => {
    expect(removeFileExtension('file.txt')).toBe('file')
    expect(removeFileExtension('document.pdf')).toBe('document')
  })

  it('should return the same string if there is no file extension', () => {
    expect(removeFileExtension('file')).toBe('file')
    expect(removeFileExtension('folder/file')).toBe('folder/file')
  })

  it('should handle strings with multiple dots correctly', () => {
    expect(removeFileExtension('archive.tar.gz')).toBe('archive.tar')
    expect(removeFileExtension('my.file.name.txt')).toBe('my.file.name')
  })

  it('should handle strings with slashes and dots correctly', () => {
    expect(removeFileExtension('/path/to/file.txt')).toBe('/path/to/file')
    expect(removeFileExtension('C:\\path\\to\\file.txt')).toBe('C:\\path\\to\\file')
  })

  it('should return the same string if the last dot is before a slash', () => {
    expect(removeFileExtension('/path.to/file')).toBe('/path.to/file')
    expect(removeFileExtension('C:\\path.to\\file')).toBe('C:\\path.to\\file')
  })

  it('should return an empty string if the input is empty', () => {
    expect(removeFileExtension('')).toBe('')
  })

  it('should handle strings with only dots correctly', () => {
    expect(removeFileExtension('.')).toBe('.')
    expect(removeFileExtension('..')).toBe('..')
  })

  it('should only remove real file extensions', () => {
    expect(removeFileExtension('4-0025.3')).toBe('4-0025.3')
  })
})
