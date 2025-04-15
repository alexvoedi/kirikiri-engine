import type { Game } from '../types/Game'
import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { KirikiriEngine } from '../classes/KirikiriEngine'
import { evalCommand } from './evalCommand'

dotenv.config()

describe('evalCommand', () => {
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

  it('should evaluate a valid expression successfully', async () => {
    const expression = 'kag.keyDownHook.remove(myKeyDownHook)'
    expect(() => evalCommand(engine, {
      exp: expression,
    })).not.toThrow()
  })
})
