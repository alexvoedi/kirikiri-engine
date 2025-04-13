import type { Game } from './types/Game'
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
    const content = await engine.loadFile('first.ks')

    expect(content).toBeDefined()
    expect(content.startsWith(';=')).toBe(true)

    // eslint-disable-next-line style/no-tabs
    expect(content.includes(';	□とりあえず、このテキストから始まる。')).toBe(true)
  })

  it('should be able to split and sanitize the content', async () => {
    const content = await engine.loadFile('first.ks')

    const lines = engine.splitAndSanitize(content)

    expect(lines).toBeDefined()
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0]).toBe('[wait time=100]')
  })

  it('can process lines without throwing an error', async () => {
    const content = await engine.loadFile('first.ks')

    const lines = engine.splitAndSanitize(content)

    expect(() => engine.processLines(lines)).not.toThrow()
  })
})
