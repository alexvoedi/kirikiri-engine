import { Sprite, Texture } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import { KirikiriLayer } from './KirikiriLayer'

describe('kirikiriLayer', () => {
  it('preserves sprite snapshot metadata when copying the front page to the back page', () => {
    const layer = new KirikiriLayer({
      SCALE: 2,
      globalOffset: {
        x: 16,
        y: 16,
      },
    } as never, 'base')

    const sprite = new Sprite({
      label: 'blob:http://localhost/runtime-image',
      texture: Texture.EMPTY,
      width: 320,
      height: 240,
    })

    ;(sprite as Sprite & {
      __kirikiriStorage?: string
      __kirikiriInteraction?: { type: string }
    }).__kirikiriStorage = 'bgimage/title.png'
    ;(sprite as Sprite & {
      __kirikiriStorage?: string
      __kirikiriInteraction?: { type: string }
    }).__kirikiriInteraction = { type: 'button' }

    layer.fore.addChild(sprite)
    layer.copyFrontToBack()

    const copied = layer.back.children[0] as Sprite & {
      __kirikiriStorage?: string
      __kirikiriInteraction?: { type: string }
    }

    expect(copied.__kirikiriStorage).toBe('bgimage/title.png')
    expect(copied.__kirikiriInteraction).toStrictEqual({ type: 'button' })
    expect(copied.width).toBe(320)
    expect(copied.height).toBe(240)
  })
})
