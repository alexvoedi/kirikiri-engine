import type { Renderable } from 'pixi.js'
import type { TransitionProfile } from '../utils/resolveTransitionProfile'
import type { KirikiriRenderer } from './KirikiriRenderer'
import { Container, Graphics, Sprite } from 'pixi.js'
import { EngineEvent } from '../constants'
import { createTransitionMask } from './KirikiriRenderer'

interface KirikiriLayerChildMetadata {
  __kirikiriStorage?: string
  __kirikiriInteraction?: unknown
}

interface KirikiriLayerAttributes {
  x?: number
  y?: number
  width?: number
  height?: number
  visible?: boolean
  autohide?: boolean
  index?: number
  frame?: string
  opacity?: number
}

interface Margins {
  left: number
  right: number
  top: number
  bottom: number
}

export class KirikiriLayer extends Container {
  readonly back = new Container({
    label: 'back',
  })

  readonly fore = new Container({
    label: 'fore',
  })

  readonly margins?: Margins

  private readonly pageMetrics: Record<'back' | 'fore', {
    width?: number
    height?: number
  }> = {
    back: {},
    fore: {},
  }

  transitioning?: boolean = false
  private transitionCleanup?: () => void

  constructor(readonly renderer: KirikiriRenderer, readonly label: string, options?: {
    margins?: Margins
  }) {
    super({
      label,
    })

    if (options) {
      if (options.margins) {
        this.margins = options.margins
      }
    }

    this.addChild(this.back)
    this.addChild(this.fore)
  }

  setPageElement(page: 'back' | 'fore', element: Renderable | Container, options?: {
    opacity?: number
    visible?: boolean
    x?: number
    y?: number
  }) {
    const pageObj = this[page]

    pageObj.removeChildren()

    if (options?.opacity !== undefined)
      pageObj.alpha = options.opacity

    if (options?.visible !== undefined)
      pageObj.visible = options.visible

    if (options?.x !== undefined)
      pageObj.x = this.renderer.SCALE * (this.renderer.globalOffset.x + options.x)

    if (options?.y !== undefined)
      pageObj.y = this.renderer.SCALE * (this.renderer.globalOffset.y + options.y)

    pageObj.addChild(element)
  }

  /**
   * Transition between between the fore and back. The fore layer slowly fades out such that the back layer is visible. If both layers are the same, it will skip the transition.
   */
  transition(profile: TransitionProfile, duration: number) {
    this.transitioning = true

    if (this.back.children.length === 0) {
      this.transitioning = false
      return
    }

    if (this.foreAndBackAreSame()) {
      this.stopTransition()
      return
    }

    const step = 1000 / (duration * 60)

    let progress = 0
    let onStopTransition: () => void

    const sequentialCrossfade = profile.kind === 'crossfade' && this.label !== 'base'
    let swappedContent = false
    const original = {
      alpha: this.fore.alpha,
      x: this.fore.x,
      y: this.fore.y,
      rotation: this.fore.rotation,
      scaleX: this.fore.scale.x,
      scaleY: this.fore.scale.y,
      pivotX: this.fore.pivot.x,
      pivotY: this.fore.pivot.y,
      mask: this.fore.mask,
    }
    const mask = !sequentialCrossfade && ['wipe', 'circle', 'blinds', 'wave'].includes(profile.kind)
      ? new Graphics()
      : undefined

    if (mask) {
      this.fore.addChild(mask)
      this.fore.mask = mask
    }

    this.transitionCleanup = () => {
      this.fore.alpha = original.alpha
      this.fore.x = original.x
      this.fore.y = original.y
      this.fore.rotation = original.rotation
      this.fore.scale.set(original.scaleX, original.scaleY)
      this.fore.pivot.set(original.pivotX, original.pivotY)
      this.fore.mask = original.mask

      if (mask) {
        mask.removeFromParent()
        mask.destroy()
      }
    }

    if (sequentialCrossfade) {
      this.back.visible = false
    }

    const iterate = (delta: { deltaTime: number }) => {
      progress = Math.min(progress + delta.deltaTime * step, 1)

      if (sequentialCrossfade) {
        if (progress < 0.5) {
          this.fore.alpha = 1 - this.smoothstep(progress * 2)
        }
        else {
          if (!swappedContent) {
            this.fore.removeChildren()
            this.back.children.forEach(child => this.fore.addChild(child))
            this.fore.alpha = 0
            swappedContent = true
          }

          this.fore.alpha = this.smoothstep((progress - 0.5) * 2)
        }
      }
      else {
        this.applyTransitionProfile(profile, progress, mask)
      }

      if (progress >= 1) {
        this.renderer.app.ticker.remove(iterate)
        globalThis.removeEventListener(EngineEvent.STOP_TRANSITION, onStopTransition)

        this.stopTransition({
          swappedContent,
        })
      }
    }

    onStopTransition = () => {
      this.renderer.app.ticker.remove(iterate)

      this.stopTransition({
        swappedContent,
      })
    }

    globalThis.addEventListener(EngineEvent.STOP_TRANSITION, onStopTransition, { once: true })

    this.renderer.app.ticker.add(iterate)
  }

  stopTransition(options?: {
    swappedContent?: boolean
  }) {
    if (!this.transitioning)
      return

    this.transitionCleanup?.()
    this.transitionCleanup = undefined
    this.fore.alpha = 0

    if (!options?.swappedContent) {
      this.fore.removeChildren()
      this.back.children.forEach(child => this.fore.addChild(child))
    }

    this.fore.alpha = 1
    this.back.visible = true

    this.transitioning = false
  }

  setPageAttributes(data: {
    page: 'back' | 'fore'
  } & KirikiriLayerAttributes) {
    const page = this[data.page]

    if (data.x !== undefined)
      page.x = this.renderer.SCALE * data.x
    if (data.y !== undefined)
      page.y = this.renderer.SCALE * data.y
    if (data.opacity !== undefined)
      page.alpha = data.opacity
    if (data.visible !== undefined)
      page.visible = data.visible
    if (data.width !== undefined) {
      page.width = this.renderer.SCALE * data.width
      this.pageMetrics[data.page].width = data.width
    }
    if (data.height !== undefined) {
      page.height = this.renderer.SCALE * data.height
      this.pageMetrics[data.page].height = data.height
    }
  }

  getPageMetrics(page: 'back' | 'fore') {
    return this.pageMetrics[page]
  }

  setLayerAttributes(data: {
    page: 'back' | 'fore'
  } & KirikiriLayerAttributes) {
    if (data.visible !== undefined)
      this.visible = data.visible
    if (data.index !== undefined)
      this.zIndex = data.index
    if (data.visible !== undefined)
      this.visible = data.visible
  }

  /**
   * Moves the layer and changes its opacity over a specified time.
   *
   * @param time - An object containing the total time and the movement path.
   * @param time.page - The page to move ('back' or 'fore').
   * @param time.time - The total time in milliseconds for the movement and opacity change.
   * @param time.path - An array of points defining the movement path, each with x, y, and opacity.
   */
  moveAndChangeOpacity({ page, time, path }: {
    page: 'back' | 'fore'
    time: number
    path: Array<{
      x: number
      y: number
      opacity: number
    }>
  }) {
    if (path.length === 0) {
      console.error('Path must contain at least one point.')
      return
    }

    const pageObj = this[page]

    const totalTime = time

    let elapsedTime = 0

    if (path.length === 1) {
      const startX = pageObj.x
      const startY = pageObj.y
      const startAlpha = pageObj.alpha

      const target = path[0]

      const iterate = (delta: { elapsedMS: number }) => {
        elapsedTime += delta.elapsedMS

        const progress = Math.min(elapsedTime / totalTime, 1)

        if (startX !== target.x) {
          pageObj.x = this.interpolate(startX, target.x, progress)
        }

        if (startY !== target.y) {
          pageObj.y = this.interpolate(startY, target.y, progress)
        }

        if (startAlpha !== target.opacity) {
          pageObj.alpha = this.interpolate(startAlpha, target.opacity, progress)
        }

        if (progress >= 1) {
          const waitForMoveNotifier = new CustomEvent(EngineEvent.MOVE_ENDED)
          globalThis.dispatchEvent(waitForMoveNotifier)

          this.renderer.app.ticker.remove(iterate)
        }
      }

      this.renderer.app.ticker.add(iterate)
      return
    }

    // Handle multiple waypoints
    const iterate = (delta: { elapsedMS: number }) => {
      elapsedTime += delta.elapsedMS

      const progress = Math.min(elapsedTime / totalTime, 1)
      const segmentIndex = Math.floor(progress * (path.length - 1))
      const segmentProgress = (progress * (path.length - 1)) % 1

      const currentPoint = path[segmentIndex]
      const nextPoint = path[segmentIndex + 1]

      if (nextPoint) {
        pageObj.x = this.interpolate(currentPoint.x, nextPoint.x, segmentProgress)
        pageObj.y = this.interpolate(currentPoint.y, nextPoint.y, segmentProgress)
        pageObj.alpha = this.interpolate(currentPoint.opacity, nextPoint.opacity, segmentProgress)
      }

      if (progress >= 1) {
        pageObj.x = path[path.length - 1].x
        pageObj.y = path[path.length - 1].y
        pageObj.alpha = path[path.length - 1].opacity

        const waitForMoveNotifier = new CustomEvent(EngineEvent.MOVE_ENDED)
        globalThis.dispatchEvent(waitForMoveNotifier)

        this.renderer.app.ticker.remove(iterate)
      }
    }

    this.renderer.app.ticker.add(iterate)
  }

  interpolate(start: number, end: number, factor: number) {
    return start + (end - start) * factor
  }

  /**
   * Copies all children properties from the front layer to the back layer.
   */
  copyFrontToBack() {
    this.back.removeChildren()

    const data = {
      position: this.fore.position,
      scale: this.fore.scale,
      rotation: this.fore.rotation,
      alpha: this.fore.alpha,
      visible: this.fore.visible,
      pivot: this.fore.pivot,
      x: this.fore.x,
      y: this.fore.y,
    }

    Object.assign(this.back, data)

    this.fore.children.forEach((child) => {
      if (child instanceof Sprite) {
        const newChild = new Sprite(child.texture)
        const childMetadata = child as Sprite & KirikiriLayerChildMetadata

        const data = {
          label: child.label,
          position: child.position,
          scale: child.scale,
          rotation: child.rotation,
          alpha: child.alpha,
          visible: child.visible,
          pivot: child.pivot,
          x: child.x,
          y: child.y,
          width: child.width,
          height: child.height,
        }

        Object.assign(newChild, data)
        ;(newChild as Sprite & KirikiriLayerChildMetadata).__kirikiriStorage = childMetadata.__kirikiriStorage
        ;(newChild as Sprite & KirikiriLayerChildMetadata).__kirikiriInteraction = childMetadata.__kirikiriInteraction

        this.back.addChild(newChild)
      }
    })
  }

  smoothstep(dt: number) {
    const t = Math.min(Math.max(dt, 0), 1)
    return t * t * (3 - 2 * t)
  }

  /**
   * Check if the front and back layers have the same children.
   */
  foreAndBackAreSame() {
    if (this.fore.children.length !== this.back.children.length)
      return false

    for (let i = 0; i < this.fore.children.length; i++) {
      const foreChild = this.fore.children[i]
      const backChild = this.back.children[i]

      if (foreChild.label !== backChild.label)
        return false
    }

    return true
  }

  private applyTransitionProfile(profile: TransitionProfile, progress: number, mask?: Graphics) {
    if (mask && ['wipe', 'circle', 'blinds', 'wave'].includes(profile.kind)) {
      createTransitionMask(profile, mask, progress, this.renderer.renderedWidth, this.renderer.renderedHeight)
      return
    }

    const eased = this.smoothstep(progress)
    const centerX = this.renderer.renderedWidth / 2
    const centerY = this.renderer.renderedHeight / 2
    this.fore.pivot.set(centerX, centerY)
    this.fore.x = centerX
    this.fore.y = centerY

    switch (profile.kind) {
      case 'mosaic':
        this.fore.alpha = 1 - Math.ceil(eased * 8) / 8
        break
      case 'rotatezoom':
        this.fore.alpha = 1 - eased
        this.fore.rotation = eased * Math.PI * 0.25
        this.fore.scale.set(1 + eased * 0.5)
        break
      case 'rotatevanish':
        this.fore.alpha = 1 - eased
        this.fore.rotation = eased * Math.PI * 0.5
        this.fore.scale.set(Math.max(0.1, 1 - eased))
        break
      case 'rotateswap':
        this.fore.alpha = 1 - eased
        this.fore.rotation = eased * Math.PI
        this.fore.scale.set(Math.max(0.1, 1 - eased * 0.3), 1)
        break
      default:
        this.fore.alpha = 1 - eased
        break
    }
  }
}
