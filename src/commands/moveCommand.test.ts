import type { KirikiriEngine } from '../classes/KirikiriEngine'
import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { setupEngine } from '../testSetup'
import { moveCommand } from './moveCommand'

dotenv.config()

describe('moveCommand', () => {
  let engine: KirikiriEngine

  beforeEach(async () => {
    engine = await setupEngine()

    vi.spyOn(engine.renderer, 'moveAndChangeOpacity').mockImplementation(() => {

    })
  })

  it('should parse props and call moveAndChangeOpacity', async () => {
    const props = {
      layer: 'layer1',
      path: '(0,0,0) (1,2,3) (4,5,6)',
      time: '100',
    }

    await moveCommand(engine, props)

    expect(engine.commandStorage).toStrictEqual({
      delay: {
        speed: 20,
      },
      move: {
        moving: true,
      },
    })
  })

  it('should throw an error if props are invalid', async () => {
    const props = {
      layer: 'layer1',
      time: '100',
      path: '(0,0,0) (x,2,3) (4,5,6)',
    }

    await expect(async () => await moveCommand(engine, props)).rejects.toThrow()
  })
})
