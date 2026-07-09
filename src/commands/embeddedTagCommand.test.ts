import { describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { embeddedTagCommand } from './embeddedTagCommand'

describe('embeddedTagCommand', () => {
  it('renders the evaluated expression result into the message layer', async () => {
    const engine = await setupEngine()
    Object.assign(engine.globalScriptContext.f as Record<string, unknown>, {
      player: 'Doremi',
    })

    const addCharacter = vi.spyOn(engine.renderer, 'addCharacterToText').mockImplementation(() => {})

    await embeddedTagCommand(engine, {
      exp: 'f.player',
    })

    expect(addCharacter.mock.calls.map(([character]) => character).join('')).toBe('Doremi')
  })
})
