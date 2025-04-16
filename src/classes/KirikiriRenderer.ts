import { Application, Assets, Rectangle, Sprite, Text, Texture } from 'pixi.js'
import { EngineEvent } from '../constants'
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

  private readonly location: {
    x: number
    y: number
  } = {
      x: 0,
      y: 0,
    }

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

    const texture = await Assets.load(file)
    const sprite = new Sprite(texture)

    sprite.width = this.app.screen.width
    sprite.height = this.app.screen.height

    const layerGroup = this.getOrCreateLayer(layer)
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
    children?: boolean
  }) {
    const fadeStep = 1000 / (options.time * 60)

    const layers = [this.layers.base, this.layers.front]

    let timer = 1
    const iterate = (delta: { deltaTime: number }) => {
      layers.forEach(layer => layer.transition(fadeStep, delta.deltaTime))

      timer -= fadeStep * delta.deltaTime

      if (timer <= 0) {
        window.dispatchEvent(new CustomEvent(EngineEvent.TRANSITION_ENDED))

        this.app.ticker.remove(iterate)
      }
    }

    const onStopTransition = () => {
      this.app.ticker.remove(iterate)

      layers.forEach(layer => layer.stopTransition())

      window.dispatchEvent(new CustomEvent(EngineEvent.TRANSITION_ENDED))
      window.removeEventListener(EngineEvent.STOP_TRANSITION, onStopTransition)
    }

    window.addEventListener(EngineEvent.STOP_TRANSITION, onStopTransition)

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

  setNextElementPosition(x?: number, y?: number) {
    if (x !== undefined) {
      this.location.x = x
    }

    if (y !== undefined) {
      this.location.y = y
    }
  }

  async addButton(data: {
    file: string
    callback: () => Promise<void>
  }): Promise<void> {
    const { file } = data

    const source = await Assets.load(file)

    const measure = new Texture({
      source,
    })

    const width = measure.width / 3
    const height = measure.height

    const baseTexture = new Texture({
      source,
      frame: new Rectangle(0, 0, width, height),
    })

    const pressedTexture = new Texture({
      source,
      frame: new Rectangle(width, 0, width, height),
    })

    const hoverTexture = new Texture({
      source,
      frame: new Rectangle(width * 2, 0, width, height),
    })

    const scale = this.app.stage.width / 758

    const buttonNormal = new Sprite(baseTexture)
    buttonNormal.width = scale * width
    buttonNormal.height = scale * height
    buttonNormal.x = scale * this.location.x
    buttonNormal.y = scale * this.location.y

    buttonNormal.interactive = true

    buttonNormal.on('pointerover', () => {
      buttonNormal.texture = hoverTexture
    })

    buttonNormal.on('pointerout', () => {
      buttonNormal.texture = baseTexture
    })

    buttonNormal.on('pointerdown', () => {
      buttonNormal.texture = pressedTexture
    })

    buttonNormal.on('pointerup', () => {
      buttonNormal.texture = hoverTexture
    })

    buttonNormal.on('click', async () => {
      await data.callback()
    })

    this.layers.message.fore.addChild(buttonNormal)
  }

  clearMessageLayerPages() {
    this.layers.message.fore.removeChildren()
    this.layers.message.back.removeChildren()

    this.layers.message0.fore.removeChildren()
    this.layers.message0.back.removeChildren()
  }

  /**
   * Copy front to back page
   */
  copyFrontToBack(layer?: string | number) {
    if (layer) {
      const layerGroup = this.getOrCreateLayer(layer)

      layerGroup.copyFrontToBack()
    }
    else {
      Object.values(this.layers).forEach((layerGroup) => {
        layerGroup.copyFrontToBack()
      })
    }
  }
}
