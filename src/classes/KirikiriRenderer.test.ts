import { Assets } from 'pixi.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KirikiriRenderer } from './KirikiriRenderer'

describe('kirikiriRenderer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('waits for asset loading to complete', async () => {
    const renderer = new KirikiriRenderer(document.createElement('canvas'))
    const load = vi.spyOn(Assets, 'load').mockResolvedValue({})

    await renderer.loadAssets(['image-a.png', 'image-b.png'])

    expect(load).toHaveBeenCalledWith(['image-a.png', 'image-b.png'])
  })

  it('calculates word wrap width from renderer dimensions', () => {
    const renderer = new KirikiriRenderer(document.createElement('canvas'))

    expect(renderer.wordWrapWidth).toBe(1496)
  })

  it('shakes around the current stage position', () => {
    const renderer = new KirikiriRenderer(document.createElement('canvas'))
    const ticker = {
      add: vi.fn((callback: (delta: { deltaTime: number }) => void) => {
        callback({ deltaTime: 1 })

        return ticker
      }),
      remove: vi.fn(() => ticker),
    }

    Object.defineProperty(renderer.app, 'ticker', {
      configurable: true,
      value: ticker,
    })

    renderer.app.stage.x = 100
    renderer.app.stage.y = 50

    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1)

    renderer.quake({
      time: 20,
      hmax: 10,
      vmax: 5,
    })

    expect(ticker.add).toHaveBeenCalledOnce()
    expect(renderer.app.stage.x).toBe(90)
    expect(renderer.app.stage.y).toBe(55)
  })
})
