import type { Sprite } from 'pixi.js'
import { Container, RenderLayer } from 'pixi.js'

export class KirikiriLayer extends Container {
  private fore: Container<Sprite>
  private back: Container<Sprite>

  constructor(stage: Container, readonly layer: string | number) {
    super()

    this.back = new Container({
      label: 'back',
    })
    stage.addChildAt(this.back, 0)

    this.fore = new Container({
      label: 'fore',
    })
    stage.addChildAt(this.fore, 1)
  }

  setPage(page: 'back' | 'fore', element: Sprite, options?: {
    visible?: boolean
  }) {
    this[page].removeChildren()

    if (page === 'fore') {
      element.visible = options?.visible ?? false
    }

    this[page].addChild(element)
  }

  transition(name: string) {
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
      page.x = data.left
    if (data.top !== undefined)
      page.y = data.top
    if (data.width !== undefined)
      page.width = data.width
    if (data.height !== undefined)
      page.height = data.height
    if (data.visible !== undefined)
      page.visible = data.visible
    if (data.opacity !== undefined)
      page.alpha = data.opacity / 255
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
}
