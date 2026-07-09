import type { ContainerChild, Graphics, TextStyleOptions } from 'pixi.js'
import type { KirikiriInteractionSnapshot, KirikiriRendererSnapshot } from '../types/KirikiriSaveGame'
import { Application, Assets, Container, Rectangle, Sprite, Text, Texture } from 'pixi.js'
import { EngineEvent } from '../constants'
import { appendCharacterWithKirikiriWrap } from '../utils/appendCharacterWithKirikiriWrap'
import { applyImageEffectsToPixels } from '../utils/applyImageEffects'
import { resolveTransitionProfile } from '../utils/resolveTransitionProfile'
import { KirikiriLayer } from './KirikiriLayer'
import { KirikiriRendererSnapshotManager } from './KirikiriRendererSnapshotManager'

const DEFAULT_FONT_SIZE = 24
const DEFAULT_LINE_SPACING = 6
const DEFAULT_JAPANESE_FONT_STACK = [
  '"Shippori Mincho"',
  '"MS PMincho"',
  '"MS Mincho"',
  '"IPAexMincho"',
  '"IPAMincho"',
  '"Hiragino Mincho ProN"',
  '"Yu Mincho"',
  '"Source Han Serif JP"',
  '"Noto Serif JP"',
  'serif',
].join(', ')
const MESSAGE_WRAP_RESERVE_CHARACTERS = 3
interface TextStyleOverrides {
  align?: 'left' | 'center' | 'right'
  fill?: string | number
  fontSize?: number
  dropShadow?: boolean
}

interface KirikiriRenderableMetadata {
  __kirikiriStorage?: string
  __kirikiriInteraction?: KirikiriInteractionSnapshot
}

export class KirikiriRenderer {
  readonly app: Application
  private readonly processedTextureCache = new Map<string, Texture>()
  private readonly snapshotManager = new KirikiriRendererSnapshotManager(this)

  /**
   * The original resolution of the canvas.
   */
  readonly RESOLUTION = {
    WIDTH: 800,
    HEIGHT: 600,
  }

  /**
   * The internal upscaling factor for modern displays.
   */
  readonly SCALE = 2

  private base!: KirikiriLayer
  private front!: Container<KirikiriLayer>
  private message0!: KirikiriLayer
  private message1!: KirikiriLayer

  private currentMessageLayer: 'message0' | 'message1' = 'message0'
  private currentMessagePage: 'back' | 'fore' = 'fore'
  private textStyleOverrides: TextStyleOverrides = {}
  private readonly textMeasureContext = document.createElement('canvas').getContext('2d')

  /**
   * Global offset.
   */
  readonly globalOffset: {
    x: number
    y: number
  } = {
    x: 16,
    y: 16,
  }

  /**
   * Message layer margins.
   */
  readonly messageLayerMargins: {
    left: number
    right: number
    top: number
    bottom: number
  } = {
    left: 12,
    right: 8,
    top: 8,
    bottom: 8,
  }

  /**
   * Store a unscaled location to be used in another command.
   */
  private readonly location: {
    x: number
    y: number
  } = {
    x: 0,
    y: 0,
  }

  constructor(
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.app = new Application()
  }

  async init() {
    await this.app.init({
      width: 2 * this.RESOLUTION.WIDTH,
      height: 2 * this.RESOLUTION.HEIGHT,
      canvas: this.canvas,
    })

    this.base = new KirikiriLayer(this, 'base')
    this.app.stage.addChild(this.base)

    this.front = new Container<KirikiriLayer>({ label: 'front' })
    this.front.sortableChildren = true
    this.app.stage.addChild(this.front)

    this.message0 = new KirikiriLayer(this, 'message0', {
      margins: {
        left: 12,
        right: 8,
        top: 8,
        bottom: 8,
      },
    })
    this.app.stage.addChild(this.message0)

    this.message1 = new KirikiriLayer(this, 'message1')
    this.app.stage.addChild(this.message1)
  }

  async loadAssets(files: string[]): Promise<void> {
    const preloadableFiles = files.filter(file => !isDeferredAssetUrl(file))

    if (preloadableFiles.length === 0) {
      return
    }

    await Assets.load(preloadableFiles)
  }

  /**
   * This is the actual resolution of the canvas.
   */
  get renderedWidth() {
    return this.SCALE * this.RESOLUTION.WIDTH
  }

  get renderedHeight() {
    return this.SCALE * this.RESOLUTION.HEIGHT
  }

  async setImage(data: {
    file: string
    storage?: string
    layer: string
    page: 'back' | 'fore'
    x?: number
    y?: number
    visible?: boolean
    opacity?: number
    grayscale?: boolean
    rgamma?: number
    ggamma?: number
    bgamma?: number
  }) {
    const {
      file,
      layer,
      page,
      opacity,
      visible,
      x,
      y,
      grayscale,
      rgamma,
      ggamma,
      bgamma,
    } = data

    const texture = await this.loadTexture(file, {
      grayscale,
      rgamma,
      ggamma,
      bgamma,
    })

    const sprite = new Sprite({
      label: file,
      texture,
      width: this.SCALE * texture.width,
      height: this.SCALE * texture.height,
    })
    ;(sprite as Sprite & KirikiriRenderableMetadata).__kirikiriStorage = data.storage

    const layerGroup = this.getOrCreateLayer(layer)
    layerGroup.setPageElement(
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

  async setZoomedImage(data: {
    file: string
    storage?: string
    layer: string
    page: 'back' | 'fore'
    sourceX: number
    sourceY: number
    sourceWidth: number
    sourceHeight: number
    destX: number
    destY: number
    destWidth: number
    destHeight: number
  }) {
    const texture = await this.loadTexture(data.file)
    const croppedTexture = new Texture({
      source: texture.source,
      frame: new Rectangle(data.sourceX, data.sourceY, data.sourceWidth, data.sourceHeight),
    })

    const sprite = new Sprite({
      label: data.file,
      texture: croppedTexture,
      width: this.SCALE * data.destWidth,
      height: this.SCALE * data.destHeight,
    })
    ;(sprite as Sprite & KirikiriRenderableMetadata).__kirikiriStorage = data.storage

    const layerGroup = this.getOrCreateLayer(data.layer)
    layerGroup.setPageElement(data.page, sprite, {
      x: data.destX,
      y: data.destY,
      visible: true,
      opacity: 1,
    })
  }

  private async loadTexture(file: string, effects?: {
    grayscale?: boolean
    rgamma?: number
    ggamma?: number
    bgamma?: number
  }): Promise<Texture> {
    if (effects?.grayscale || effects?.rgamma !== undefined || effects?.ggamma !== undefined || effects?.bgamma !== undefined) {
      return this.loadProcessedTexture(file, effects)
    }

    if (isDeferredAssetUrl(file)) {
      const image = await loadImageElement(file)
      return Texture.from(image)
    }

    return Assets.get(file) ?? await Assets.load(file)
  }

  private async loadProcessedTexture(file: string, effects: {
    grayscale?: boolean
    rgamma?: number
    ggamma?: number
    bgamma?: number
  }): Promise<Texture> {
    const cacheKey = JSON.stringify([file, effects])
    const cached = this.processedTextureCache.get(cacheKey)

    if (cached) {
      return cached
    }

    const image = await loadImageElement(file)
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')

    if (!context) {
      const fallbackTexture = Texture.from(image)
      this.processedTextureCache.set(cacheKey, fallbackTexture)
      return fallbackTexture
    }

    context.drawImage(image, 0, 0)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    imageData.data.set(applyImageEffectsToPixels(imageData.data, effects))
    context.putImageData(imageData, 0, 0)

    const texture = Texture.from(canvas)
    this.processedTextureCache.set(cacheKey, texture)

    return texture
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

  transition(options: {
    time: number
    method?: string
    rule?: string
    children?: boolean
  }) {
    const layers = this.getLayersArr()
    const profile = resolveTransitionProfile({
      method: options.method,
      rule: options.rule,
    })

    if (options.children) {
      layers.forEach(layer => layer.transition(profile, options.time))
    }
    else {
      this.base.transition(profile, options.time)
    }

    let timeout: ReturnType<typeof setTimeout>

    const onStopTransition = () => {
      clearTimeout(timeout)
      globalThis.removeEventListener(EngineEvent.STOP_TRANSITION, onStopTransition)

      globalThis.dispatchEvent(new CustomEvent(EngineEvent.TRANSITION_ENDED))
    }

    timeout = setTimeout(() => {
      globalThis.removeEventListener(EngineEvent.STOP_TRANSITION, onStopTransition)

      globalThis.dispatchEvent(new CustomEvent(EngineEvent.TRANSITION_ENDED))
    }, options.time)

    globalThis.addEventListener(EngineEvent.STOP_TRANSITION, onStopTransition)
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

  addCharacterToText(character: string, indent?: boolean) {
    let textContainer = this[this.currentMessageLayer][this.currentMessagePage].getChildByLabel('text-container') as Container

    if (!textContainer) {
      textContainer = new Container({
        label: 'text-container',
        x: this.SCALE * this.messageLayerMargins.left,
        y: this.SCALE * this.messageLayerMargins.top, // this is intentional
      })

      this[this.currentMessageLayer].setPageElement(this.currentMessagePage, textContainer)

      // whenever we write text, we must make sure that the layer is visible
      this[this.currentMessageLayer][this.currentMessagePage].alpha = 1
      this[this.currentMessageLayer][this.currentMessagePage].visible = true

      this.resetLocation()
    }

    if (indent) {
      const textElement = textContainer.getChildByLabel('text-1') as Text

      if (textElement) {
        this.appendCharacterToTextElement(textElement, character, this.wordWrapWidth - textElement.x)
      }
      else {
        const speakerElement = textContainer.getChildByLabel('text-0') as Text

        if (!speakerElement) {
          throw new Error('Speaker text element not found')
        }

        const textElement = new Text({
          text: character,
          label: 'text-1',
          style: this.textStyle,
          x: speakerElement.x + speakerElement.width,
          y: speakerElement.y,
        })

        textContainer.addChild(textElement)
      }
    }
    else {
      const textElement = textContainer.getChildByLabel('text-0') as Text

      if (textElement) {
        this.appendCharacterToTextElement(textElement, character, this.wordWrapWidth)
      }
      else {
        const textElement = new Text({
          text: character,
          label: 'text-0',
          style: this.textStyle,
        })

        textContainer.addChild(textElement)
      }
    }
  }

  private appendCharacterToTextElement(textElement: Text, character: string, availableWidth: number) {
    const fontSize = typeof textElement.style.fontSize === 'number'
      ? textElement.style.fontSize
      : this.SCALE * DEFAULT_FONT_SIZE

    textElement.text = appendCharacterWithKirikiriWrap({
      text: textElement.text,
      character,
      firstLineWidth: availableWidth,
      wrappedLineWidth: this.wordWrapWidth,
      reserveWidth: MESSAGE_WRAP_RESERVE_CHARACTERS * fontSize,
      measureText: value => this.measureTextWidth(value, {
        fontFamily: textElement.style.fontFamily,
        fontSize,
      }),
    })
  }

  private measureTextWidth(text: string, style: {
    fontFamily: string | string[]
    fontSize: number
  }) {
    if (!this.textMeasureContext) {
      return text.length * style.fontSize
    }

    const fontFamily = Array.isArray(style.fontFamily)
      ? style.fontFamily.join(', ')
      : style.fontFamily

    this.textMeasureContext.font = `${style.fontSize}px ${fontFamily}`

    return this.textMeasureContext.measureText(text).width
  }

  /**
   * Calculate the word wrap width for the message box.
   */
  get wordWrapWidth() {
    const currentLayer = this[this.currentMessageLayer]
    const pageMetrics = currentLayer?.getPageMetrics(this.currentMessagePage)

    if (pageMetrics?.width !== undefined) {
      return this.SCALE * (pageMetrics.width - this.messageLayerMargins.left - this.messageLayerMargins.right)
    }

    return this.renderedWidth - this.SCALE * (2 * this.globalOffset.x + this.messageLayerMargins.left + this.messageLayerMargins.right)
  }

  setFont(data: {
    color?: string
    shadow?: boolean | 'default' | 'no'
    size?: number | 'default'
  }) {
    if (data.color) {
      if (data.color === 'default') {
        delete this.textStyleOverrides.fill
      }
      else {
        this.textStyleOverrides.fill = data.color
      }
    }

    if (data.shadow !== undefined) {
      if (data.shadow === 'default') {
        delete this.textStyleOverrides.dropShadow
      }
      else {
        this.textStyleOverrides.dropShadow = data.shadow !== false && data.shadow !== 'no'
      }
    }

    if (data.size !== undefined) {
      if (data.size === 'default') {
        delete this.textStyleOverrides.fontSize
      }
      else {
        this.textStyleOverrides.fontSize = this.SCALE * data.size
      }
    }
  }

  setStyle(data: {
    align?: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'default'
  }) {
    if (data.align !== undefined) {
      if (data.align === 'default' || data.align === 'left' || data.align === 'top') {
        delete this.textStyleOverrides.align
      }
      else if (data.align === 'bottom') {
        this.textStyleOverrides.align = 'right'
      }
      else {
        this.textStyleOverrides.align = data.align
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
      this.app.stage.x = startX + (Math.random() * 2 - 1) * hmax
      this.app.stage.y = startY + (Math.random() * 2 - 1) * vmax

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

  clearMessageLayerPages() {
    [this.message0, this.message1].forEach((layer) => {
      layer.fore.removeChildren()
      layer.back.removeChildren()
    })
  }

  /**
   * Remove all children from the fore and back of all message layers.
   */
  clearMessageLayers() {
    this.clearMessageLayerPages();

    [this.message0, this.message1].forEach((layer) => {
      layer.fore.alpha = 1
      layer.fore.visible = true

      layer.back.alpha = 1
      layer.back.visible = true
    })
  }

  /**
   * Clear all message layers and reset the current message layer and page.
   */
  clearText() {
    this.clearMessageLayers()

    this.currentMessageLayer = 'message0'
    this.currentMessagePage = 'fore'
  }

  /**
   * Move and change the opacity
   */
  moveAndChangeOpacity({ layer, ...rest }: {
    layer: string
    page: 'back' | 'fore'
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
    interaction?: KirikiriInteractionSnapshot
    storage?: string
    position?: {
      x: number
      y: number
      width?: number
      height?: number
    }
  }): Promise<void> {
    const button = await this.createInteractiveButtonSprite(data.file, data.callback, {
      interaction: data.interaction,
      storage: data.storage,
      position: data.position,
    })

    this[this.currentMessageLayer][this.currentMessagePage].addChild(button)
  }

  /**
   * Add a link to the message layer.
   */
  addLink(text: string, onClick: () => void | Promise<void>, options?: {
    interaction?: KirikiriInteractionSnapshot
    position?: {
      x: number
      y: number
    }
    style?: Partial<TextStyleOptions>
  }) {
    const element = this.createInteractiveLinkElement(text, {
      onClick,
      interaction: options?.interaction,
      position: options?.position,
      style: options?.style,
    })

    this[this.currentMessageLayer][this.currentMessagePage].addChild(element)
  }

  createSnapshot(): KirikiriRendererSnapshot {
    return this.snapshotManager.createSnapshot()
  }

  async restoreSnapshot(snapshot: KirikiriRendererSnapshot, options: {
    createInteractionHandler: (interaction: KirikiriInteractionSnapshot) => () => Promise<void>
    resolveStorage: (storage: string) => Promise<string>
  }): Promise<void> {
    await this.snapshotManager.restoreSnapshot(snapshot, options)
  }

  async createInteractiveButtonSprite(file: string, callback: () => Promise<void>, options?: {
    interaction?: KirikiriInteractionSnapshot
    storage?: string
    position?: {
      x: number
      y: number
      width?: number
      height?: number
    }
  }) {
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
      width: options?.position?.width ?? this.SCALE * width,
      height: options?.position?.height ?? this.SCALE * height,
      x: options?.position?.x ?? this.SCALE * (this.globalOffset.x + this.messageLayerMargins.left + this.location.x),
      y: options?.position?.y ?? this.SCALE * (this.globalOffset.y + this.messageLayerMargins.top + this.location.y),
    })

    if (!options?.position) {
      this.resetLocation()
    }

    buttonNormal.eventMode = 'static'
    buttonNormal.cursor = 'pointer'

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

    buttonNormal.on('pointertap', async () => {
      await callback()
    })

    ;(buttonNormal as Sprite & KirikiriRenderableMetadata).__kirikiriInteraction = options?.interaction
    ;(buttonNormal as Sprite & KirikiriRenderableMetadata).__kirikiriStorage = options?.storage

    return buttonNormal
  }

  createInteractiveLinkElement(text: string, options: {
    onClick: () => void | Promise<void>
    interaction?: KirikiriInteractionSnapshot
    position?: {
      x: number
      y: number
    }
    style?: Partial<TextStyleOptions>
  }) {
    const topOffset = this[this.currentMessageLayer][this.currentMessagePage].children.reduce((acc, child) => {
      if (child instanceof Text) {
        return acc + child.height
      }
      return acc
    }, 0)

    const element = new Text({
      text,
      label: 'link',
      style: {
        ...this.textStyle,
        ...options.style,
      },
      x: options.position?.x ?? this.SCALE * (this.globalOffset.x + this.messageLayerMargins.left + this.location.x),
      y: options.position?.y ?? (
        this.location.y
          ? this.SCALE * (this.globalOffset.y + this.messageLayerMargins.top + this.location.y)
          : topOffset + this.SCALE * this.messageLayerMargins.top
      ),
    })

    if (!options.position) {
      this.resetLocation()
    }

    element.eventMode = 'static'
    element.cursor = 'pointer'
    element.hitArea = new Rectangle(0, 0, Math.max(element.width, this.wordWrapWidth), element.height)

    element.on('pointerover', () => {
      element.style.fill = 0xFF0000
    })

    element.on('pointerout', () => {
      element.style.fill = 0xFFFFFF
    })

    element.on('pointertap', options.onClick)

    ;(element as Text & KirikiriRenderableMetadata).__kirikiriInteraction = options.interaction

    return element
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

    const traverse = (node: ContainerChild, depth: number) => {
      const indent = ' '.repeat(depth * 2)
      tree.push(`${indent}${node.label} (${node.constructor.name})`)

      if (node instanceof Container) {
        node.children.forEach((child) => {
          traverse(child, depth + 1)
        })
      }
    }

    traverse(this.app.stage, 0)

    return tree.join('\n')
  }

  get textStyle() {
    const fontSize = this.textStyleOverrides.fontSize ?? this.SCALE * DEFAULT_FONT_SIZE

    return {
      fontFamily: DEFAULT_JAPANESE_FONT_STACK,
      fontSize,
      lineHeight: fontSize + this.SCALE * DEFAULT_LINE_SPACING,
      fill: 0xFFFFFF,
      breakWords: false,
      wordWrap: false,
      ...this.textStyleOverrides,
    }
  }

  isInitialized() {
    return Boolean(this.base && this.front && this.message0 && this.message1)
  }

  getCurrentMessageLayer() {
    return this.currentMessageLayer
  }

  setCurrentMessageLayer(layer: 'message0' | 'message1') {
    this.currentMessageLayer = layer
  }

  getCurrentMessagePage() {
    return this.currentMessagePage
  }

  setCurrentMessagePage(page: 'back' | 'fore') {
    this.currentMessagePage = page
  }

  getTextStyleOverrides() {
    return { ...this.textStyleOverrides }
  }

  setTextStyleOverrides(overrides: Partial<TextStyleOverrides>) {
    this.textStyleOverrides = { ...overrides }
  }

  getLocation() {
    return { ...this.location }
  }

  sortDynamicLayers() {
    this.front.sortChildren()
  }

  resetForSnapshotRestore() {
    this.front.removeChildren().forEach(child => child.destroy({ children: true }))
    this.clearLayer('base')
    this.clearMessageLayers()
  }
}

export function createTransitionMask(profile: ReturnType<typeof resolveTransitionProfile>, graphics: Graphics, progress: number, width: number, height: number) {
  graphics.clear()

  switch (profile.kind) {
    case 'wipe': {
      switch (profile.direction) {
        case 'left':
          graphics.rect(progress * width, 0, width * (1 - progress), height)
          break
        case 'right':
          graphics.rect(0, 0, width * (1 - progress), height)
          break
        case 'up':
          graphics.rect(0, progress * height, width, height * (1 - progress))
          break
        case 'down':
          graphics.rect(0, 0, width, height * (1 - progress))
          break
        case 'diagonal':
          graphics.moveTo(0, 0)
          graphics.lineTo(width * (1 - progress), 0)
          graphics.lineTo(0, height * (1 - progress))
          graphics.closePath()
          break
      }

      break
    }
    case 'circle': {
      const radius = profile.mode === 'shrink'
        ? Math.max(width, height) * (1 - progress)
        : Math.max(width, height) * progress

      graphics.circle(width / 2, height / 2, Math.max(0, radius))
      break
    }
    case 'blinds': {
      const stripeWidth = width / 10
      for (let index = 0; index < 10; index += 1) {
        const x = index * stripeWidth
        graphics.rect(x, 0, stripeWidth * (1 - progress), height)
      }
      break
    }
    case 'wave': {
      graphics.moveTo(0, 0)
      for (let y = 0; y <= height; y += 16) {
        const x = width * (1 - progress) + Math.sin((y / height) * Math.PI * 4) * 24
        graphics.lineTo(Math.max(0, x), y)
      }
      graphics.lineTo(0, height)
      graphics.closePath()
      break
    }
    default:
      graphics.rect(0, 0, width, height)
      break
  }

  graphics.fill(0xFFFFFF)
}

function isDeferredAssetUrl(file: string): boolean {
  return file.startsWith('blob:') || file.startsWith('data:')
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.decoding = 'async'
  image.src = src

  if (image.complete && image.naturalWidth > 0) {
    return image
  }

  await new Promise<void>((resolve, reject) => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener('error', () => reject(new Error(`Failed to load image ${src}`)), { once: true })
  })

  return image
}
