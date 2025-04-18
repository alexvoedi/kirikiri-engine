import type { KirikiriEngine } from '../classes/KirikiriEngine'
import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { setupEngine } from '../testSetup'
import { delayCommand } from './delayCommand'

dotenv.config()

describe('delayCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()
  })

  it('should handle setting the delay value to a number', async () => {
    const props = { speed: '200' }
    await delayCommand(engine, props)
    expect(engine.commandStorage).toStrictEqual({
      delay: {
        speed: 200,
      },
    })
  })

  it('should handle setting the delay value to "nowait"', async () => {
    const props = { speed: 'nowait' }
    await delayCommand(engine, props)
    expect(engine.commandStorage).toStrictEqual({
      delay: {
        speed: 'nowait',
      },
    })
  })
})
