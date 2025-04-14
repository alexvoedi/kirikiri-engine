import { Application, Assets, Container, Sprite, Texture } from 'pixi.js'
import { KirikiriLayer } from './KirikiriLayer'

export class KirikiriRenderer {
  private readonly app: Application
  private readonly layers: Record<string, KirikiriLayer> = {}

  constructor(
    private readonly container: HTMLDivElement,
  ) {
    this.app = new Application()
  }

  async init() {
    await this.app.init({
      resizeTo: this.container,
    })

    this.container.appendChild(this.app.canvas)

    const baseLayer = new KirikiriLayer(this.app.stage, 'base')
    this.app.stage.addChildAt(baseLayer, 0)
    this.layers.base = baseLayer

    const frontLayer = new KirikiriLayer(this.app.stage, 'front')
    this.app.stage.addChildAt(frontLayer, 1)
    this.layers.front = frontLayer

    const messageLayer = new KirikiriLayer(this.app.stage, 'message0')
    this.app.stage.addChildAt(messageLayer, 2)
    this.layers.message = messageLayer
  }

  async setImage(data: {
    file: string
    layer: string | number
    page: 'back' | 'fore'
    opacity?: number
    x?: number
    y?: number
    visible?: boolean
  }) {
    const { file, layer, page, opacity = 1, x = 0, y = 0, visible = true } = data

    const layerGroup = this.getOrCreateLayer(layer)

    const texture = await Assets.load(file)
    const sprite = new Sprite(texture)

    sprite.width = this.app.screen.width
    sprite.height = this.app.screen.height

    layerGroup.setPage(
      page,
      sprite,
    )
  }

  getOrCreateLayer(layer: string | number): KirikiriLayer {
    if (!this.layers[layer]) {
      this.layers[layer] = new KirikiriLayer(this.app.stage, layer)

      if (typeof layer === 'string') {
        if (layer.startsWith('message')) {
          this.layers.message.addChildAt(this.layers[layer], 0)
        }
      }
      else {
        this.layers.front.addChildAt(this.layers[layer], 0)
      }
    }

    return this.layers[layer]
  }

  getLayersArr(): KirikiriLayer[] {
    return Object.values(this.layers)
  }

  transition(name: string) {
    const layers = this.getLayersArr()

    for (const layer of layers) {
      layer.transition(name)
    }
  }

  setPosition(data: {
    layer?: string | number
    page?: 'back' | 'fore'
    left?: number
    top?: number
    width?: number
    height?: number
    visible?: boolean
    frame?: string
    opacity?: number
  }) {
    const {
      layer = 'message0',
      page = 'fore',
      left = 0,
      top = 0,
      width = 0,
      height = 0,
      visible = true,
      frame = '',
      opacity = 1,
    } = data

    const layerGroup = this.getOrCreateLayer(layer)

    layerGroup.setPosition({
      page,
      left,
      top,
      width,
      height,
      visible,
      frame,
      opacity,
    })
  }

  setLayerOptions(data: {
    layer: string | number
    page: 'back' | 'fore'
    visible?: boolean
    autohide?: boolean
    index?: number
  }) {
    const { layer, page, visible = true, autohide = false, index } = data

    const layerGroup = this.getOrCreateLayer(layer)

    console.log(data, layerGroup)

    layerGroup.setLayerOptions({
      page,
      visible,
      autohide,
      index,
    })
  }
}
