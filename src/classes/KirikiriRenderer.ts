import { Application, Assets, Sprite, Text } from 'pixi.js'
import { KirikiriLayer } from './KirikiriLayer'

export class KirikiriRenderer {
  private readonly app: Application
  private layers!: {
    base: KirikiriLayer
    front: KirikiriLayer
    message: KirikiriLayer
  } & Record<string, KirikiriLayer>

  private textElement!: Text

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

    const baseLayer = new KirikiriLayer(this.app, 'base')
    baseLayer.zIndex = 0
    this.app.stage.addChild(baseLayer)

    const frontLayer = new KirikiriLayer(this.app, 'front')
    frontLayer.zIndex = 1
    this.app.stage.addChild(frontLayer)

    const messageLayer = new KirikiriLayer(this.app, 'message')
    messageLayer.zIndex = 100
    this.app.stage.addChild(messageLayer)

    const message3Layer = new KirikiriLayer(this.app, 3)
    message3Layer.zIndex = 200
    messageLayer.addChild(message3Layer)

    const message0Layer = new KirikiriLayer(this.app, 'message0')
    message0Layer.zIndex = 300
    messageLayer.addChild(message0Layer)

    this.layers = {
      base: baseLayer,
      front: frontLayer,
      message: messageLayer,
      message0: message0Layer,
      3: message3Layer,
    }

    this.textElement = new Text({
      text: '',
      style: {
        fontSize: 24,
        fill: 0xFFFFFF,
        fontFamily: 'Kiwi Maru',
        wordWrap: true,
      },
    })

    message0Layer.setPage('fore', this.textElement)
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
    const { file, layer, page } = data

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

  getOrCreateLayer(layer: string | number) {
    if (!this.layers[layer]) {
      const newLayer = new KirikiriLayer(this.app, layer)

      if (typeof layer === 'string') {
        if (layer.startsWith('message')) {
          this.layers.message.addChild(newLayer)
        }
        else {
          throw new Error(`Layer ${layer} not found`)
        }
      }
      else {
        if (layer === 3) {
          this.layers.message.addChild(newLayer)
        }
        else {
          this.layers.front.addChild(newLayer)
        }
      }

      this.layers[layer] = newLayer
    }

    return this.layers[layer]
  }

  getLayersArr() {
    return Object.values(this.layers)
  }

  transition() {
    const layers = this.getLayersArr()

    for (const layer of layers) {
      layer.transition()
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

    layerGroup.setLayerOptions({
      page,
      visible,
      autohide,
      index,
    })
  }

  setText(text: string) {
    this.textElement.text = text
  }

  /**
   * Remove all children from the fore and back of all message layers.
   */
  clearMessageLayers() {
    this.layers.message.fore.removeChildren()
    this.layers.message.back.removeChildren()
  }

  /**
   * Remove all children from the specified layer.
   */
  clearLayer(layer: string | number, page?: 'back' | 'fore') {
    const layerGroup = this.getOrCreateLayer(layer)

    if (page) {
      layerGroup[page].removeChildren()
    }
    else {
      layerGroup.fore.removeChildren()
      layerGroup.back.removeChildren()
    }
  }
}
