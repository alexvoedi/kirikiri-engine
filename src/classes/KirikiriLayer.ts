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
  }) {
    this[page].removeChildren()

    if (page === 'fore') {
      element.visible = options?.visible ?? true
    }

    this[page].addChild(element)
  }

  transition() {
    const fore = this.fore.getChildByLabel('fore') as Sprite

    if (!fore)
      return

    fore.alpha = 1
    fore.visible = false

    const back = this.back.getChildByLabel('back') as Sprite

    if (!back)
      return

    fore.texture = back.texture
    fore.visible = true

    back.removeFromParent()
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
