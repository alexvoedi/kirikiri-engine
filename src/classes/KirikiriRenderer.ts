import { Application, Assets, Sprite, Text } from 'pixi.js'
import { KirikiriLayer } from './KirikiriLayer'

export class KirikiriRenderer {
  private readonly app: Application
  private layers!: {
    base: KirikiriLayer
    front: KirikiriLayer
    message: KirikiriLayer
    3: KirikiriLayer
    message0: KirikiriLayer
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

    window.addEventListener('resize', () => {
      Object.values(this.layers).forEach((layer) => {
        layer.resize(this.app.screen.width, this.app.screen.height)
      })
    })

    this.container.appendChild(this.app.canvas)

    const baseLayer = new KirikiriLayer(this.app, 'base')
    this.app.stage.addChild(baseLayer)

    const frontLayer = new KirikiriLayer(this.app, 'front')
    this.app.stage.addChild(frontLayer)

    const messageLayer = new KirikiriLayer(this.app, 'message')
    this.app.stage.addChild(messageLayer)

    const message3Layer = new KirikiriLayer(this.app, 3)
    this.app.stage.addChild(message3Layer)

    const message0Layer = new KirikiriLayer(this.app, 'message0')
    this.app.stage.addChild(message0Layer)

    this.layers = {
      base: baseLayer,
      front: frontLayer,
      message: messageLayer,
      message0: message0Layer,
      3: message3Layer,
    }

    this.textElement = new Text({
      text: 'dummy',
      style: {
        fontSize: this.app.screen.height / 35,
        fill: 0xFFFFFF,
        fontFamily: 'Kiwi Maru',
        wordWrap: true,
        breakWords: true,
        wordWrapWidth: this.app.screen.width,
      },
    })

    message0Layer.setPage('fore', this.textElement)
  }

  async setImage(data: {
    file: string
    layer: string | number
    page: 'back' | 'fore'
    x?: number
    y?: number
    visible?: boolean
    opacity?: number
  }) {
    const { file, layer, page, opacity } = data

    const layerGroup = this.getOrCreateLayer(layer)

    const texture = await Assets.load(file)
    const sprite = new Sprite(texture)

    sprite.width = this.app.screen.width
    sprite.height = this.app.screen.height

    layerGroup.setPage(
      page,
      sprite,
      {
        opacity,
      },
    )
  }

  getOrCreateLayer(layer: string | number) {
    if (layer === 'message') {
      return this.layers.message
    }

    if (layer === 'message0') {
      return this.layers.message0
    }

    if (layer === 3) {
      return this.layers[3]
    }

    if (!this.layers[layer]) {
      const newLayer = new KirikiriLayer(this.app, layer)

      this.layers.front.addChild(newLayer)

      this.layers[layer] = newLayer
    }

    return this.layers[layer]
  }

  transition(transitionName: 'universal' | 'scroll' | 'crossfade' | 'turn' | 'rotatezoom', options: {
    time: number
  }) {
    const fadeStep = 1000 / (options.time * 60)

    const layers = [this.layers.base, this.layers.front]

    let timer = 1
    const iterate = (delta: { deltaTime: number }) => {
      layers.forEach(layer => layer.transition(fadeStep, delta.deltaTime))

      timer -= fadeStep * delta.deltaTime

      if (timer <= 0) {
        const waitForTransitionNotifier = new CustomEvent('wt')
        window.dispatchEvent(waitForTransitionNotifier)

        this.app.ticker.remove(iterate)
      }
    }

    this.app.ticker.add(iterate)
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

    layerGroup.setPageAttributes({
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

    layerGroup.setLayerAttributes({
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
    // todo: clear the layer
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

  /**
   * Clear text command
   */
  clearText() {
    this.textElement.text = ''
    this.layers[3].alpha = 0
    this.layers[3].back.removeChildren()
    this.layers[3].fore.removeChildren()
  }

  /**
   * Move and change the opacity
   */
  moveAndChangeOpacity({ layer, ...rest }: {
    layer: string | number
    time: number
    path: Array<{
      x: number
      y: number
      opacity: number
    }>
  }) {
    const layerObj = this.getOrCreateLayer(layer)

    layerObj.moveAndChangeOpacity(rest)
  }
}
