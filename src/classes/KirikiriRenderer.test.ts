import { Assets, Graphics } from 'pixi.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendCharacterWithKirikiriWrap } from '../utils/appendCharacterWithKirikiriWrap'
import { createTransitionMask, KirikiriRenderer } from './KirikiriRenderer'

describe('kirikiriRenderer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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

    expect(renderer.wordWrapWidth).toBe(1376)
  })

  it('uses the message insets for the text container origin', async () => {
    const renderer = new KirikiriRenderer(document.createElement('canvas'))

    await renderer.init()
    renderer.addCharacterToText('a')

    const textContainer = (renderer as unknown as { message0: { fore: { getChildByLabel: (label: string) => { x: number, y: number } | undefined } } })
      .message0
      .fore
      .getChildByLabel('text-container')

    expect(textContainer?.x).toBe(64)
    expect(textContainer?.y).toBe(32)
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

  it('wraps when the next character would overflow even before the reserve threshold', () => {
    const result = appendCharacterWithKirikiriWrap({
      text: 'abc',
      character: 'd',
      firstLineWidth: 35,
      wrappedLineWidth: 35,
      reserveWidth: 0,
      measureText: value => value.length * 10,
    })

    expect(result).toBe('abc\nd')
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

  it('skips transition mask updates for destroyed graphics', () => {
    const graphics = new Graphics()

    graphics.destroy()

    expect(() => createTransitionMask(
      {
        kind: 'wipe',
        direction: 'left',
      },
      graphics,
      0.5,
      100,
      100,
    )).not.toThrow()
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

  it('loads blob-backed button sprites without pixi asset parsing', async () => {
    const renderer = new KirikiriRenderer(document.createElement('canvas'))
    const originalImage = globalThis.Image
    const load = vi.spyOn(Assets, 'load')

    class MockImage extends originalImage {
      constructor() {
        super()
        Object.defineProperty(this, 'complete', { configurable: true, get: () => true })
        Object.defineProperty(this, 'naturalWidth', { configurable: true, get: () => 72 })
        Object.defineProperty(this, 'naturalHeight', { configurable: true, get: () => 24 })
      }
    }

    vi.stubGlobal('Image', MockImage)

    const sprite = await renderer.createInteractiveButtonSprite(
      'blob:http://localhost/button',
      vi.fn(async () => {}),
    )

    expect(load).not.toHaveBeenCalled()
    expect(sprite.width).toBe(48)
    expect(sprite.height).toBe(48)
  })
})
