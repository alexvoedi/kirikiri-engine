import type { KirikiriEngine } from '../classes/KirikiriEngine'
import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { setupEngine } from '../testSetup'
import { evalCommand } from './evalCommand'

dotenv.config()

describe('evalCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()
  })

  it('should evaluate a valid expression successfully', async () => {
    const expression = 'kag.keyDownHook.remove(myKeyDownHook)'
    expect(() => evalCommand(engine, {
      exp: expression,
    })).not.toThrow()
  })
})
