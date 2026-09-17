import { Assets, Container, Texture } from 'pixi.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AsdAnimation } from './AsdAnimation'
import { AsdSpriteAnimation } from './AsdSpriteAnimation'

describe('asdSpriteAnimation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('creates a sprite animation from an asd script and removes it again', async () => {
    const container = new Container()
    const ticker = {
      add: vi.fn(),
      remove: vi.fn(),
    }
    const animation = new AsdAnimation(`*start
@copy sx=0 sy=0 sw=24 sh=24 dx=1 dy=2
@wait time=50
@copy sx=24 sy=0 sw=24 sh=24 dx=3 dy=4
@wait time=60
@jump target=*start`)
    const source = document.createElement('canvas')
    source.width = 48
    source.height = 24
    const load = vi.spyOn(Assets, 'load').mockResolvedValue(Texture.from(source).source)
    const player = new AsdSpriteAnimation(container, ticker as never)
    const placeFrame = vi.fn((frame, sprite) => {
      sprite.x = frame.dx
      sprite.y = frame.dy
    })

    await player.show({
      animation,
      file: 'pageBreak_a.png',
      label: 'asd-sprite',
      placeFrame,
      scale: 2,
      zIndex: 7,
    })

    expect(load).toHaveBeenCalledWith('pageBreak_a.png')
    expect(ticker.add).toHaveBeenCalledOnce()
    expect(placeFrame).toHaveBeenCalledWith({
      dx: 1,
      dy: 2,
      sx: 0,
      sy: 0,
      sw: 24,
      sh: 24,
      duration: 50,
    }, expect.anything())
    expect(container.children).toHaveLength(1)
    expect(container.children[0]?.label).toBe('asd-sprite')
    expect(container.children[0]?.width).toBe(48)
    expect(container.children[0]?.height).toBe(48)
    expect(container.children[0]?.zIndex).toBe(7)

    player.hide()

    expect(ticker.remove).toHaveBeenCalledOnce()
    expect(container.children).toHaveLength(0)
  })

  it('loads blob-backed sprites without going through pixi assets', async () => {
    const container = new Container()
    const ticker = {
      add: vi.fn(),
      remove: vi.fn(),
    }
    const originalImage = globalThis.Image
    const load = vi.spyOn(Assets, 'load')
    const source = document.createElement('canvas')
    source.width = 24
    source.height = 24

    class MockImage extends originalImage {
      constructor() {
        super()
        Object.defineProperty(this, 'complete', { configurable: true, get: () => true })
        Object.defineProperty(this, 'naturalWidth', { configurable: true, get: () => 24 })
        Object.defineProperty(this, 'naturalHeight', { configurable: true, get: () => 24 })
      }
    }

    vi.stubGlobal('Image', MockImage)
    const textureFrom = vi.spyOn(Texture, 'from').mockReturnValue(Texture.from(source))
    const player = new AsdSpriteAnimation(container, ticker as never)

    await player.show({
      animation: [{
        dx: 0,
        dy: 0,
        sx: 0,
        sy: 0,
        sw: 24,
        sh: 24,
        duration: 50,
      }],
      file: 'blob:http://localhost/pageBreak_a',
    })

    expect(load).not.toHaveBeenCalled()
    expect(textureFrom).toHaveBeenCalled()
  })
})
