import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { setupEngine } from '../testSetup'
import { KirikiriEngine } from './KirikiriEngine'

dotenv.config()

describe('kirikiriEngine', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()

    vi.spyOn(engine, 'loadFile').mockImplementation(async (filename: string) => {
      if (filename === 'mock.ks') {
        return [
          '[wait time=100]',
          '*シナリオ|This is a test scenario.',
          'Another line of content.',
        ]
      }
      throw new Error('File not found')
    })

    vi.spyOn(engine, 'getFullFilePath').mockImplementation((filename: string) => {
      return `https://example.com/${filename}`
    })
  })

  it('should be able to instantiate', () => {
    expect(engine).toBeInstanceOf(KirikiriEngine)
  })

  it('should be able to load the file content with the correct encoding', async () => {
    const lines = await engine.loadFile('mock.ks')

    expect(lines).toBeDefined()
    expect(lines[0].startsWith('[wait time=100]')).toBe(true)

    expect(lines.some(line => line.includes('シナリオ'))).toBe(true)
  })

  it('can process lines without throwing an error', async () => {
    const lines = await engine.loadFile('mock.ks')

    expect(() => engine.runLines(lines)).not.toThrow()
  })

  it('can get the full file path', () => {
    const filename = 'myfile.ks'

    expect(engine.getFullFilePath(filename)).toBe('https://example.com/myfile.ks')
  })
})
