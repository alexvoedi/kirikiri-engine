import type { Game } from '../types/Game'
import process from 'node:process'
import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { KirikiriEngine } from './KirikiriEngine'

dotenv.config()

describe('kirikiriEngine', () => {
  let engine: KirikiriEngine

  beforeAll(async () => {
    const root = process.env.GAME_ROOT ?? ''
    const url = new URL('/ojamajo/files.json', root)
    const files = await fetch(url)

    const game: Game = {
      root,
      entry: 'first.ks',
      files: await files.json(),
    }

    const container = document.createElement('div')

    engine = new KirikiriEngine({ container, game })
  })

  it('should be able to instantiate', () => {
    expect(engine).toBeInstanceOf(KirikiriEngine)
  })

  it('should be able to load the file content with the correct encoding', async () => {
    const lines = await engine.loadFile('first.ks')

    expect(lines).toBeDefined()
    expect(lines[0].startsWith('[wait time=100]')).toBe(true)

    expect(lines.some(line => line.includes('シナリオ'))).toBe(true)
  })

  it('can process lines without throwing an error', async () => {
    const lines = await engine.loadFile('first.ks')

    expect(() => engine.runLines(lines)).not.toThrow()
  })

  it('can get the full file path', () => {
    const filename = 'どれみ1015.mpg'

    expect(engine.getFullFilePath(filename)).toBe('https://static.nekatz.com/ojamajo/video/どれみ1015.mp4')
  })
})
