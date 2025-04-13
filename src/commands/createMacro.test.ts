import type { Game } from '../types/Game'
import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { KirikiriEngine } from '../KirikiriEngine'
import { createMacro } from './createMacro'

dotenv.config()

describe('createMacro', () => {
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

  const lines = [
    '[position layer=message0 page=back left=20 top=465 width=768 height=105 opacity=0]',
    '[layopt layer=3 page=back visible=true autohide=true index=800000]',
    '[image storage=mesFrame.tlg page=back layer=3 left=0 top=0 opacity=255]',
    '[trans time=500 method=crossfade]',
    '[wt]',
  ]

  it('should create a macro with valid inputs', async () => {
    const props = {
      name: 'testMacro',
      lines,
    }

    const result = await createMacro(engine, props)

    expect(result.name).toBe('testMacro')
    expect(typeof result.macro).toBe('function')
  })

  it('should execute the macro with valid props', async () => {
    const props = {
      name: 'testMacro',
      lines,
    }

    const result = await createMacro(engine, props)

    const macroProps = {
      layer: 'message0',
      page: 'back',
      left: '20',
      top: '465',
      width: '768',
      height: '105',
      opacity: '0',
    }

    await result.macro(macroProps)

    // dont throw
    expect(() => {
      result.macro(macroProps)
    }).not.toThrow()
  })
})
