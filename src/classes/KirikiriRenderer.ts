import { Application, Assets, Container, Rectangle, Sprite, Text, Texture } from 'pixi.js'
import { EngineEvent } from '../constants'
import { KirikiriLayer } from './KirikiriLayer'

export class KirikiriRenderer {
  readonly app: Application

  private base!: KirikiriLayer
  private front!: Container<KirikiriLayer>
  private message0!: KirikiriLayer
  private message1!: KirikiriLayer

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
      this.getLayersArr().forEach((layer) => {
        layer.resize(this.app.screen.width, this.app.screen.height)
      })
    })

    this.container.appendChild(this.app.canvas)

    this.base = new KirikiriLayer(this, 'base')
    this.app.stage.addChild(this.base)

    this.front = new Container<KirikiriLayer>({ label: 'front' })
    this.front.sortableChildren = true
    this.app.stage.addChild(this.front)

    this.message0 = new KirikiriLayer(this, 'message0')
    this.app.stage.addChild(this.message0)

    this.message1 = new KirikiriLayer(this, 'message1')
    this.app.stage.addChild(this.message1)
  }

  get scale() {
    return this.app.stage.width / 758
  }

  async setImage(data: {
    file: string
    layer: string
    page: 'back' | 'fore'
    x?: number
    y?: number
    visible?: boolean
    opacity?: number
  }) {
    const { file, layer, page, opacity, visible, x, y } = data

    const texture = await Assets.load(file)
    const sprite = new Sprite({
      texture,
      width: this.app.screen.width,
      height: this.app.screen.height,
      label: file,
    })

    const layerGroup = this.getOrCreateLayer(layer)
    layerGroup.setPage(
      page,
      sprite,
      {
        opacity,
        visible,
        x,
        y,
      },
    )
  }

  getLayersArr() {
    return [this.base, ...this.front.children, this.message0, this.message1]
  }

  getOrCreateLayer(layer: string): KirikiriLayer {
    switch (layer) {
      case 'base':
        return this.base
      case 'message0':
        return this.message0
      case 'message1':
        return this.message1
      default: {
        const existingLayer = this.front.children.find(child => child.label === layer)

        if (existingLayer) {
          return existingLayer
        }
        else {
          const newLayer = new KirikiriLayer(this, layer)

          // if layer can be converted to a number, the number is used as the zindex
          const zIndex = Number(layer)

          this.front.addChild(newLayer)

          if (!Number.isNaN(zIndex)) {
            newLayer.zIndex = zIndex
            this.front.sortChildren()
          }

          return newLayer
        }
      }
    }
  }

  transition(transitionName: 'universal' | 'scroll' | 'crossfade' | 'turn' | 'rotatezoom', options: {
    time: number
    children?: boolean
  }) {
    const fadeStep = 1000 / (options.time * 60)

    const layers = this.getLayersArr()

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

  setPosition({
    layer,
    page,
    ...rest
  }: {
    layer: string
    page: 'back' | 'fore'
    x?: number
    y?: number
    width?: number
    height?: number
    visible?: boolean
    frame?: string
    opacity?: number
  }) {
    const layerGroup = this.getOrCreateLayer(layer)

    layerGroup.setPageAttributes({
      page,
      ...rest,
    })
  }

  setLayerOptions(data: {
    layer: string
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
    const textElement = this.message0.fore.getChildByLabel('textelement') as Text

    if (textElement) {
      textElement.text = text
    }
    else {
      const textElement = new Text({
        text,
        label: 'textelement',
        style: {
          fontSize: this.app.screen.height / 35,
          fill: 0xFFFFFF,
          fontFamily: 'Kiwi Maru',
          wordWrap: true,
          breakWords: true,
          wordWrapWidth: this.app.screen.width,
        },
        x: this.scale * this.location.x,
        y: this.scale * this.location.y,
      })

      this.resetLocation()

      this.message0.setPage('fore', textElement)
    }
  }

  addCharacterToText(character: string, indent?: boolean) {
    let textContainer = this.message0.fore.getChildByLabel('text-container') as Container

    if (!textContainer) {
      textContainer = new Container({
        label: 'text-container',
        x: this.scale * this.location.x,
        y: this.scale * this.location.y,
      })

      this.resetLocation()

      this.message0.setPage('fore', textContainer)
    }

    if (indent) {
      const textElement = textContainer.getChildByLabel('text-1') as Text

      if (textElement) {
        textElement.text += character
      }
      else {
        const speakerElement = textContainer.getChildByLabel('text-0') as Text

        if (!speakerElement) {
          throw new Error('Speaker text element not found')
        }

        const textElement = new Text({
          text: character,
          label: 'text-1',
          style: {
            fontSize: this.app.screen.height / 28,
            fill: 0xFFFFFF,
            fontFamily: 'Kiwi Maru',
          },
          x: speakerElement.x + speakerElement.width,
          y: speakerElement.y,
        })

        textContainer.addChild(textElement)
      }
    }
    else {
      const textElement = textContainer.getChildByLabel('text-0') as Text

      if (textElement) {
        textElement.text += character
      }
      else {
        const textElement = new Text({
          text: character,
          label: 'text-0',
          style: {
            fontSize: this.app.screen.height / 28,
            fill: 0xFFFFFF,
            fontFamily: 'Kiwi Maru',
          },
        })

        textContainer.addChild(textElement)
      }
    }
  }

  setFont(data: {
    color?: string
    shadow?: boolean
  }) {
    const textElement = this.message0.fore.getChildByLabel('textelement') as Text

    if (textElement) {
      if (data.color && data.color !== 'default') {
        textElement.style.fill = data.color
      }

      if (data.shadow) {
        textElement.style.dropShadow = true
      }
    }
  }

  /**
   * The quake function creates a shaking effect with random movements on the x and y axes.
   * The maximum movement from the default position is determined by the hmax and vmax parameters.
   */
  quake(data: {
    time: number
    hmax: number
    vmax: number
  }) {
    const { time, hmax, vmax } = data

    let timer = time
    const startX = this.app.stage.x
    const startY = this.app.stage.y

    const shake = (delta: { deltaTime: number }) => {
      this.app.stage.x = Math.random() * hmax
      this.app.stage.y = Math.random() * vmax

      timer -= (delta.deltaTime * 10)

      if (timer <= 0) {
        this.app.ticker.remove(shake)
        this.app.stage.x = startX
        this.app.stage.y = startY
      }
    }

    this.app.ticker.add(shake)
  }

  /**
   * Remove all children from the fore and back of all message layers.
   */
  clearMessageLayers() {
    [this.message0, this.message1].forEach((layer) => {
      layer.fore.removeChildren()
      layer.fore.alpha = 255
      layer.fore.visible = true

      layer.back.removeChildren()
      layer.back.alpha = 255
      layer.back.visible = true
    })
  }

  /**
   * Remove all children from the specified layer.
   */
  clearLayer(layer: string, page?: 'back' | 'fore') {
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
    this.message0.back.removeChildren()
    this.message0.fore.removeChildren()
  }

  /**
   * Move and change the opacity
   */
  moveAndChangeOpacity({ layer, ...rest }: {
    layer: string
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

  setLocation(x?: number, y?: number) {
    if (x !== undefined) {
      this.location.x = x
    }

    if (y !== undefined) {
      this.location.y = y
    }
  }

  resetLocation() {
    this.location.x = 0
    this.location.y = 0
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

    const buttonNormal = new Sprite({
      texture: baseTexture,
      label: file,
      width: this.scale * width,
      height: this.scale * height,
      x: this.scale * this.location.x,
      y: this.scale * this.location.y,
    })

    this.resetLocation()

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

    this.message0.fore.addChild(buttonNormal)
  }

  clearMessageLayerPages() {
    this.message0.fore.removeChildren()
    this.message0.back.removeChildren()

    this.message1.fore.removeChildren()
    this.message1.back.removeChildren()
  }

  /**
   * Copy front to back page
   */
  copyFrontToBack(layer?: string) {
    if (layer) {
      const layerGroup = this.getOrCreateLayer(layer)

      layerGroup.copyFrontToBack()
    }
    else {
      this.getLayersArr().forEach((layerGroup) => {
        layerGroup.copyFrontToBack()
      })
    }
  }

  /**
   * This function recursively traverses the entire tree of the app stage and logs the name and type of each child.
   */
  getTreeString() {
    const tree: string[] = []

    const traverse = (node: any, depth: number) => {
      const indent = ' '.repeat(depth * 2)
      tree.push(`${indent}${node.label} (${node.constructor.name})`)

      node.children.forEach((child: any) => {
        traverse(child, depth + 1)
      })
    }

    traverse(this.app.stage, 0)

    return tree.join('\n')
  }
}
