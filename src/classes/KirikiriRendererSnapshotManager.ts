import type { ContainerChild, TextStyleOptions } from 'pixi.js'
import type { JsonValue, KirikiriInteractionSnapshot, KirikiriRendererNodeSnapshot, KirikiriRendererSnapshot } from '../types/KirikiriSaveGame'
import type { KirikiriLayer } from './KirikiriLayer'
import type { KirikiriRenderer } from './KirikiriRenderer'
import { Assets, Container, Rectangle, Sprite, Text, Texture } from 'pixi.js'

interface InteractiveNode {
  __kirikiriInteraction?: KirikiriInteractionSnapshot
  __kirikiriStorage?: string
}

const SERIALIZABLE_TEXT_STYLE_KEYS = [
  'align',
  'breakWords',
  'dropShadow',
  'fill',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'stroke',
  'strokeThickness',
  'wordWrap',
  'wordWrapWidth',
] as const

export class KirikiriRendererSnapshotManager {
  constructor(private readonly renderer: KirikiriRenderer) {}

  createSnapshot(): KirikiriRendererSnapshot {
    if (!this.renderer.isInitialized()) {
      return {
        currentMessageLayer: this.renderer.getCurrentMessageLayer(),
        currentMessagePage: this.renderer.getCurrentMessagePage(),
        textStyleOverrides: this.toJsonRecord(this.renderer.getTextStyleOverrides()),
        location: this.renderer.getLocation(),
        layers: [],
      }
    }

    return {
      currentMessageLayer: this.renderer.getCurrentMessageLayer(),
      currentMessagePage: this.renderer.getCurrentMessagePage(),
      textStyleOverrides: this.toJsonRecord(this.renderer.getTextStyleOverrides()),
      location: this.renderer.getLocation(),
      layers: this.renderer.getLayersArr().map(layer => ({
        label: layer.label,
        zIndex: layer.zIndex,
        visible: layer.visible,
        pages: {
          back: this.serializePage(layer, 'back'),
          fore: this.serializePage(layer, 'fore'),
        },
      })),
    }
  }

  async restoreSnapshot(snapshot: KirikiriRendererSnapshot, options: {
    createInteractionHandler: (interaction: KirikiriInteractionSnapshot) => () => Promise<void>
    resolveStorage: (storage: string) => Promise<string>
  }): Promise<void> {
    if (!this.renderer.isInitialized()) {
      return
    }

    this.renderer.resetForSnapshotRestore()
    this.renderer.setCurrentMessageLayer(snapshot.currentMessageLayer)
    this.renderer.setCurrentMessagePage(snapshot.currentMessagePage)
    this.renderer.setTextStyleOverrides(this.fromJsonRecord(snapshot.textStyleOverrides))
    this.renderer.setLocation(snapshot.location.x, snapshot.location.y)

    for (const layerSnapshot of snapshot.layers) {
      const layer = this.renderer.getOrCreateLayer(layerSnapshot.label)
      layer.visible = layerSnapshot.visible
      layer.zIndex = layerSnapshot.zIndex

      await this.restorePage(layer, 'back', layerSnapshot.pages.back, options)
      await this.restorePage(layer, 'fore', layerSnapshot.pages.fore, options)
    }

    this.renderer.sortDynamicLayers()
  }

  private serializePage(layer: KirikiriLayer, page: 'back' | 'fore') {
    const pageObj = layer[page]
    const metrics = layer.getPageMetrics(page)

    return {
      x: pageObj.x,
      y: pageObj.y,
      alpha: pageObj.alpha,
      visible: pageObj.visible,
      width: metrics.width,
      height: metrics.height,
      children: pageObj.children.map(child => this.serializeNode(child)),
    }
  }

  private serializeNode(node: ContainerChild): KirikiriRendererNodeSnapshot {
    const base = {
      label: node.label,
      x: node.x,
      y: node.y,
      alpha: node.alpha,
      visible: node.visible,
      rotation: node.rotation,
      scaleX: node.scale.x,
      scaleY: node.scale.y,
      pivotX: node.pivot.x,
      pivotY: node.pivot.y,
      interaction: (node as ContainerChild & InteractiveNode).__kirikiriInteraction,
      storage: (node as ContainerChild & InteractiveNode).__kirikiriStorage,
    }

    if (node instanceof Text) {
      return {
        type: 'text',
        ...base,
        text: node.text,
        style: this.extractTextStyle(node.style as unknown as Record<string, unknown>),
      }
    }

    if (node instanceof Sprite) {
      const frame = node.texture.frame

      return {
        type: 'sprite',
        ...base,
        file: typeof node.label === 'string' ? node.label : undefined,
        storage: base.storage,
        width: node.width,
        height: node.height,
        frame: frame
          ? {
              x: frame.x,
              y: frame.y,
              width: frame.width,
              height: frame.height,
            }
          : undefined,
      }
    }

    if (node instanceof Container) {
      return {
        type: 'container',
        ...base,
        children: node.children.map(child => this.serializeNode(child)),
      }
    }

    return {
      type: 'container',
      ...base,
      children: [],
    }
  }

  private async restorePage(layer: KirikiriLayer, page: 'back' | 'fore', snapshot: KirikiriRendererSnapshot['layers'][number]['pages']['back'], options: {
    createInteractionHandler: (interaction: KirikiriInteractionSnapshot) => () => Promise<void>
    resolveStorage: (storage: string) => Promise<string>
  }) {
    const pageObj = layer[page]
    pageObj.removeChildren()
    pageObj.x = snapshot.x
    pageObj.y = snapshot.y
    pageObj.alpha = snapshot.alpha
    pageObj.visible = snapshot.visible

    if (snapshot.width !== undefined || snapshot.height !== undefined) {
      layer.setPageAttributes({
        page,
        width: snapshot.width,
        height: snapshot.height,
      })
      pageObj.x = snapshot.x
      pageObj.y = snapshot.y
      pageObj.alpha = snapshot.alpha
      pageObj.visible = snapshot.visible
    }

    for (const child of snapshot.children) {
      pageObj.addChild(await this.restoreNode(child, options))
    }
  }

  private async restoreNode(snapshot: KirikiriRendererNodeSnapshot, options: {
    createInteractionHandler: (interaction: KirikiriInteractionSnapshot) => () => Promise<void>
    resolveStorage: (storage: string) => Promise<string>
  }): Promise<ContainerChild> {
    if (snapshot.type === 'sprite' && snapshot.file) {
      if (snapshot.interaction?.type === 'button') {
        const buttonFile = snapshot.storage ? await options.resolveStorage(snapshot.storage) : snapshot.file

        return await this.renderer.createInteractiveButtonSprite(buttonFile, options.createInteractionHandler(snapshot.interaction), {
          interaction: snapshot.interaction,
          storage: snapshot.storage,
          position: {
            x: snapshot.x,
            y: snapshot.y,
            width: snapshot.width,
            height: snapshot.height,
          },
        })
      }

      const file = snapshot.storage ? await options.resolveStorage(snapshot.storage) : snapshot.file
      const texture = await this.loadSpriteTexture(file, snapshot.frame)

      const sprite = new Sprite({
        label: file,
        texture,
        width: snapshot.width,
        height: snapshot.height,
      })
      ;(sprite as Sprite & InteractiveNode).__kirikiriStorage = snapshot.storage

      this.applyNodeTransform(sprite, snapshot)
      return sprite
    }

    if (snapshot.type === 'text') {
      if (snapshot.interaction?.type === 'link') {
        const element = this.renderer.createInteractiveLinkElement(snapshot.text ?? '', {
          onClick: options.createInteractionHandler(snapshot.interaction),
          interaction: snapshot.interaction,
          position: {
            x: snapshot.x,
            y: snapshot.y,
          },
          style: this.fromJsonRecord(snapshot.style ?? {}) as Partial<TextStyleOptions>,
        })
        this.applyNodeTransform(element, snapshot)
        return element
      }

      const element = new Text({
        text: snapshot.text ?? '',
        label: snapshot.label,
        style: this.fromJsonRecord(snapshot.style ?? {}) as TextStyleOptions,
      })
      this.applyNodeTransform(element, snapshot)
      return element
    }

    const container = new Container({
      label: snapshot.label,
    })
    this.applyNodeTransform(container, snapshot)

    for (const child of snapshot.children ?? []) {
      container.addChild(await this.restoreNode(child, options))
    }

    return container
  }

  private async loadSpriteTexture(file: string, frame?: KirikiriRendererNodeSnapshot['frame']) {
    const texture = isDeferredAssetUrl(file)
      ? Texture.from(await loadImageElement(file))
      : Texture.from(await Assets.load(file))

    if (!frame) {
      return texture
    }

    return new Texture({
      source: texture.source,
      frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
    })
  }

  private applyNodeTransform(node: ContainerChild, snapshot: KirikiriRendererNodeSnapshot) {
    node.x = snapshot.x
    node.y = snapshot.y
    node.alpha = snapshot.alpha
    node.visible = snapshot.visible
    node.rotation = snapshot.rotation
    node.scale.set(snapshot.scaleX, snapshot.scaleY)
    node.pivot.set(snapshot.pivotX, snapshot.pivotY)
  }

  private extractTextStyle(style: Record<string, unknown>) {
    const result: Record<string, JsonValue> = {}
    const seen = new WeakSet<object>()

    SERIALIZABLE_TEXT_STYLE_KEYS.forEach((key) => {
      const value = style[key]
      const jsonValue = this.toJsonValue(value, seen)

      if (jsonValue !== undefined) {
        result[key] = jsonValue
      }
    })

    return result
  }

  private toJsonRecord(value: Record<string, unknown>): Record<string, JsonValue> {
    const result: Record<string, JsonValue> = {}
    const seen = new WeakSet<object>()
    seen.add(value)

    Object.entries(value).forEach(([key, item]) => {
      const jsonValue = this.toJsonValue(item, seen)

      if (jsonValue !== undefined) {
        result[key] = jsonValue
      }
    })

    return result
  }

  private fromJsonRecord(value: Record<string, JsonValue>) {
    return structuredClone(value) as Record<string, unknown>
  }

  private toJsonValue(value: unknown, seen: WeakSet<object>): JsonValue | undefined {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value
    }

    if (Array.isArray(value)) {
      return value
        .map(item => this.toJsonValue(item, seen))
        .filter((item): item is JsonValue => item !== undefined)
    }

    if (typeof value === 'object') {
      if (typeof EventTarget !== 'undefined' && value instanceof EventTarget) {
        return undefined
      }

      if (seen.has(value)) {
        return undefined
      }

      seen.add(value)
      const result: Record<string, JsonValue> = {}

      Object.entries(value).forEach(([key, item]) => {
        const jsonValue = this.toJsonValue(item, seen)

        if (jsonValue !== undefined) {
          result[key] = jsonValue
        }
      })

      return result
    }

    return undefined
  }
}

function isDeferredAssetUrl(file: string) {
  return file.startsWith('blob:') || file.startsWith('data:')
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image ${src}`))
    image.src = src
  })
}
