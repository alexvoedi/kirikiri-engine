import type { Renderable } from 'pixi.js'
import type { KirikiriRenderer } from './KirikiriRenderer'
import { Container, Sprite } from 'pixi.js'
import { EngineEvent } from '../constants'

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

  transitioning?: boolean = false

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
  transition(duration: number) {
    this.transitioning = true

    if (this.foreAndBackAreSame()) {
      this.stopTransition()
      return
    }

    const step = 1000 / (duration * 60)

    let progress = 0
    const iterate = (delta: { deltaTime: number }) => {
      progress = Math.min(progress + delta.deltaTime * step, 1)

      this.fore.alpha = 1 - this.smoothstep(progress)

      if (progress >= 1) {
        this.renderer.app.ticker.remove(iterate)

        this.stopTransition()
      }
    }

    window.addEventListener(EngineEvent.STOP_TRANSITION, () => {
      this.renderer.app.ticker.remove(iterate)

      this.stopTransition()
    }, { once: true })

    this.renderer.app.ticker.add(iterate)
  }

  stopTransition() {
    if (!this.transitioning)
      return

    this.fore.alpha = 0

    this.fore.removeChildren()
    this.back.children.forEach(child => this.fore.addChild(child))

    this.fore.alpha = 1

    this.transitioning = false
  }

  setPageAttributes(data: {
    page: 'back' | 'fore'
  } & KirikiriLayerAttributes) {
    const page = this[data.page]

    if (data.x !== undefined)
      page.x = this.renderer.SCALE * ((this.margins?.left ?? 0) + data.x)
    if (data.y !== undefined)
      page.y = this.renderer.SCALE * ((this.margins?.top ?? 0) + data.y)
    if (data.opacity !== undefined)
      page.alpha = data.opacity
    if (data.visible !== undefined)
      page.visible = data.visible
    if (data.width !== undefined)
      page.width = this.renderer.SCALE * data.width
    if (data.height !== undefined)
      page.height = this.renderer.SCALE * data.height
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
          const waitForMoveNotifier = new CustomEvent('wm')
          window.dispatchEvent(waitForMoveNotifier)

          this.renderer.app.ticker.remove(iterate)
        }
      }

      this.renderer.app.ticker.add(iterate)
      return
    }

    // Handle multiple waypoints
    const iterate = (delta: { deltaTime: number }) => {
      elapsedTime += delta.deltaTime

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

        const waitForMoveNotifier = new CustomEvent('wm')
        setTimeout(() => {
          window.dispatchEvent(waitForMoveNotifier)
        }, time * 1000)

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

        const data = {
          label: child.label,
          position: child.position,
          scale: child.scale,
          rotation: child.rotation,
          visible: child.visible,
          pivot: child.pivot,
          x: child.x,
          y: child.y,
          width: child.width,
          height: child.height,
        }

        Object.assign(newChild, data)

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
}
