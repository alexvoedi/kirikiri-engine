import { Sprite, Text, Texture } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import { KirikiriRendererSnapshotManager } from './KirikiriRendererSnapshotManager'

describe('kirikiriRendererSnapshotManager', () => {
  it('skips cyclic object references while serializing style-like data', () => {
    const manager = new KirikiriRendererSnapshotManager({
      isInitialized: () => false,
      getCurrentMessageLayer: () => 'message0',
      getCurrentMessagePage: () => 'fore',
      getTextStyleOverrides: () => {
        const cyclic: Record<string, unknown> = {
          fill: 0xFFFFFF,
        }
        cyclic.self = cyclic
        cyclic.nested = {
          ok: true,
          parent: cyclic,
        }
        return cyclic
      },
      getLocation: () => ({ x: 0, y: 0 }),
    } as never)

    const snapshot = manager.createSnapshot()

    expect(snapshot.textStyleOverrides).toStrictEqual({
      fill: 0xFFFFFF,
      nested: {
        ok: true,
      },
    })
  })

  it('serializes only safe text style fields for text nodes', async () => {
    const textNode = new Text({
      text: 'hello',
      label: 'text-0',
      style: {
        fill: 0xFFFFFF,
        fontSize: 24,
        wordWrap: true,
      },
    })

    const manager = new KirikiriRendererSnapshotManager({
      isInitialized: () => true,
      getCurrentMessageLayer: () => 'message0',
      getCurrentMessagePage: () => 'fore',
      getTextStyleOverrides: () => ({}),
      getLocation: () => ({ x: 0, y: 0 }),
      getLayersArr: () => [{
        label: 'message0',
        zIndex: 0,
        visible: true,
        getPageMetrics: () => ({}),
        back: {
          x: 0,
          y: 0,
          alpha: 1,
          visible: true,
          children: [],
        },
        fore: {
          x: 0,
          y: 0,
          alpha: 1,
          visible: true,
          children: [textNode],
        },
      }],
    } as never)

    const snapshot = manager.createSnapshot()
    const serializedNode = snapshot.layers[0]?.pages.fore.children[0]

    expect(serializedNode?.type).toBe('text')
    expect(serializedNode?.style).toMatchObject({
      fill: 0xFFFFFF,
      fontSize: 24,
      wordWrap: true,
    })
    expect(serializedNode?.style).not.toHaveProperty('_events')
  })

  it('prefers original storage names over runtime file labels for sprites', () => {
    const sprite = new Sprite({
      label: 'blob:http://localhost/runtime-image',
      texture: Texture.EMPTY,
      width: 400,
      height: 300,
    })

    ;(sprite as Sprite & { __kirikiriStorage?: string }).__kirikiriStorage = 'bgimage/title.png'

    const manager = new KirikiriRendererSnapshotManager({
      isInitialized: () => true,
      getCurrentMessageLayer: () => 'message0',
      getCurrentMessagePage: () => 'fore',
      getTextStyleOverrides: () => ({}),
      getLocation: () => ({ x: 0, y: 0 }),
      getLayersArr: () => [{
        label: 'base',
        zIndex: 0,
        visible: true,
        getPageMetrics: () => ({}),
        back: {
          x: 0,
          y: 0,
          alpha: 1,
          visible: true,
          children: [],
        },
        fore: {
          x: 0,
          y: 0,
          alpha: 1,
          visible: true,
          children: [sprite],
        },
      }],
    } as never)

    const snapshot = manager.createSnapshot()
    const serializedNode = snapshot.layers[0]?.pages.fore.children[0]

    expect(serializedNode?.type).toBe('sprite')
    expect(serializedNode?.file).toBe('blob:http://localhost/runtime-image')
    expect(serializedNode?.storage).toBe('bgimage/title.png')
  })
})
