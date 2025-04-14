import type { Game } from '../types/Game'
import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { KirikiriEngine } from '../KirikiriEngine'
import { createImageCommand } from './createImageCommand'

dotenv.config()

describe('createImageCommand', () => {
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

  it('should run the command without errors', async () => {
    const defaultProps = { storage: 'album', layer: 'base' }
    const props = { visible: 'true', index: '1', left: '100' }

    const command = createImageCommand(engine, defaultProps)

    await expect(command(props)).resolves.not.toThrow()
  })
})
