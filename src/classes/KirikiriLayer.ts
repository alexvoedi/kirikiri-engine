import type { Application, Renderable, Sprite } from 'pixi.js'
import { Container } from 'pixi.js'

export class KirikiriLayer extends Container {
  readonly fore: Container
  readonly back: Container

  constructor(private readonly app: Application, readonly layer: string | number) {
    super({
      label: `${layer}`,
    })

    this.back = new Container({
      label: 'back',
    })
    this.addChild(this.back)

    this.fore = new Container({
      label: 'fore',
    })
    this.addChild(this.fore)
  }

  setPage(page: 'back' | 'fore', element: Renderable, options?: {
    visible?: boolean
    opacity?: number
  }) {
    const pageObj = this[page]

    pageObj.removeChildren()

    pageObj.visible = options?.visible ?? page !== 'fore'

    if (options?.opacity !== undefined) {
      pageObj.alpha = options.opacity
    }

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

  setPosition(data: {
    page: 'back' | 'fore'
    left?: number
    top?: number
    width?: number
    height?: number
    visible?: boolean
    frame?: string
    opacity?: number
  }) {
    const page = this[data.page]

    if (data.left !== undefined)
      page.x = (this.app.screen.width / 480) * data.left
    if (data.top !== undefined)
      page.y = (this.app.screen.height / 576) * data.top
  }

  setLayerOptions(data: {
    page: 'back' | 'fore'
    visible?: boolean
    autohide?: boolean
    index?: number
  }) {
    if (data.visible !== undefined)
      this.visible = data.visible
    if (data.index !== undefined)
      this.zIndex = data.index
  }

  reset() {
    this.back.removeChildren()
    this.fore.removeChildren()
  }
}
