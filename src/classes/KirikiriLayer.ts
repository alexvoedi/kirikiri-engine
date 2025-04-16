import type { Application, Renderable } from 'pixi.js'
import { Container } from 'pixi.js'

interface KirikiriLayerAttributes {
  left?: number
  top?: number
  width?: number
  height?: number
  visible?: boolean
  autohide?: boolean
  index?: number
  frame?: string
  opacity?: number
}

export class KirikiriLayer extends Container {
  readonly back = new Container({
    label: 'back',
  })

  readonly fore = new Container({
    label: 'fore',
  })

  constructor(private readonly app: Application, readonly layer: string | number) {
    super({
      label: `${layer}`,
    })

    this.addChild(this.back)
    this.addChild(this.fore)
  }

  setPage(page: 'back' | 'fore', element: Renderable, options?: {
    opacity?: number
  }) {
    const pageObj = this[page]

    pageObj.removeChildren()

    if (options?.opacity !== undefined)
      this.alpha = options.opacity

    pageObj.addChild(element)
  }

  transition(step: number, dt: number) {
    this.fadeTransition(step, dt)
  }

  fadeTransition(step: number, dt: number) {
    this.fore.alpha -= step * dt

    if (this.fore.alpha <= 0) {
      this.fore.alpha = 0

      this.fore.removeChildren()
      this.back.children.forEach(child => this.fore.addChild(child))
      this.back.removeChildren()

      this.fore.alpha = 1
    }
  }

  setPageAttributes(data: {
    page: 'back' | 'fore'
  } & KirikiriLayerAttributes) {
    const page = this[data.page]

    if (data.left !== undefined)
      page.x = (this.app.screen.width / 480) * data.left
    if (data.top !== undefined)
      page.y = (this.app.screen.height / 576) * data.top
  }

  setLayerAttributes(data: {
    page: 'back' | 'fore'
  } & KirikiriLayerAttributes) {
    if (data.visible !== undefined)
      this.visible = data.visible
    if (data.index !== undefined)
      this.zIndex = data.index
  }

  reset() {
    this.back.removeChildren()
    this.fore.removeChildren()
  }

  /**
   * Moves the layer and changes its opacity over a specified time.
   *
   * @param time - An object containing the total time and the movement path.
   * @param time.time - The total time in milliseconds for the movement and opacity change.
   * @param time.path - An array of points defining the movement path, each with x, y, and opacity.
   */
  moveAndChangeOpacity({ time, path }: {
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

    const totalTime = time

    let elapsedTime = 0

    if (path.length === 1) {
      const startX = this.x
      const startY = this.y
      const startAlpha = this.alpha

      const target = path[0]

      const iterate = (delta: { elapsedMS: number }) => {
        elapsedTime += delta.elapsedMS

        const progress = Math.min(elapsedTime / totalTime, 1)

        if (startX !== target.x) {
          this.x = this.interpolate(startX, target.x, progress)
        }

        if (startY !== target.y) {
          this.y = this.interpolate(startY, target.y, progress)
        }

        if (startAlpha !== target.opacity) {
          this.alpha = this.interpolate(startAlpha, target.opacity, progress)
        }

        if (progress >= 1) {
          const waitForMoveNotifier = new CustomEvent('wm')
          window.dispatchEvent(waitForMoveNotifier)

          this.app.ticker.remove(iterate)
        }
      }

      this.app.ticker.add(iterate)
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
        this.x = this.interpolate(currentPoint.x, nextPoint.x, segmentProgress)
        this.y = this.interpolate(currentPoint.y, nextPoint.y, segmentProgress)
        this.alpha = this.interpolate(currentPoint.opacity, nextPoint.opacity, segmentProgress)
      }

      if (progress >= 1) {
        this.x = path[path.length - 1].x
        this.y = path[path.length - 1].y
        this.alpha = path[path.length - 1].opacity

        const waitForMoveNotifier = new CustomEvent('wm')
        setTimeout(() => {
          window.dispatchEvent(waitForMoveNotifier)
        }, time * 1000)

        this.app.ticker.remove(iterate)
      }
    }

    this.app.ticker.add(iterate)
  }

  interpolate(start: number, end: number, factor: number) {
    return start + (end - start) * factor
  }
}
