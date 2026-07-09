import { Assets } from 'pixi.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendCharacterWithKirikiriWrap } from '../utils/appendCharacterWithKirikiriWrap'
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

  it('skips blob urls during batch preloading', async () => {
    const renderer = new KirikiriRenderer(document.createElement('canvas'))
    const load = vi.spyOn(Assets, 'load').mockResolvedValue({})

    await renderer.loadAssets([
      'image-a.png',
      'blob:http://127.0.0.1:1337/example',
      'data:image/png;base64,AAAA',
    ])

    expect(load).toHaveBeenCalledWith(['image-a.png'])
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

  it('applies and resets text alignment style', () => {
    const renderer = new KirikiriRenderer(document.createElement('canvas'))

    renderer.setStyle({ align: 'center' })

    expect(renderer.textStyle.align).toBe('center')

    renderer.setStyle({ align: 'default' })

    expect(renderer.textStyle.align).toBeUndefined()
  })

  it('wraps before ordinary characters near the right edge', () => {
    const result = appendCharacterWithKirikiriWrap({
      text: 'abcd',
      character: 'e',
      firstLineWidth: 40,
      wrappedLineWidth: 40,
      reserveWidth: 10,
      measureText: value => value.length * 10,
    })

    expect(result).toBe('abcd\ne')
  })

  it('keeps japanese closing punctuation on the current line', () => {
    const result = appendCharacterWithKirikiriWrap({
      text: 'abcd',
      character: '。',
      firstLineWidth: 40,
      wrappedLineWidth: 40,
      reserveWidth: 10,
      measureText: value => value.length * 10,
    })

    expect(result).toBe('abcd。')
  })

  it('uses full message width after the first indented line wraps', () => {
    const result = appendCharacterWithKirikiriWrap({
      text: 'ab\ncd',
      character: 'e',
      firstLineWidth: 20,
      wrappedLineWidth: 50,
      reserveWidth: 10,
      measureText: value => value.length * 10,
    })

    expect(result).toBe('ab\ncde')
  })
})
