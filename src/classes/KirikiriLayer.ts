import type { Sprite } from 'pixi.js'
import { Container, RenderLayer } from 'pixi.js'

export class KirikiriLayer extends RenderLayer {
  private fore: Container<Sprite>
  private back: Container<Sprite>

  constructor(stage: Container, readonly layer: string | number) {
    super()

    this.back = new Container({
      label: 'back',
    })
    this.attach(this.back)
    stage.addChildAt(this.back, 0)

    this.fore = new Container({
      label: 'fore',
    })
    this.attach(this.fore)
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
}
