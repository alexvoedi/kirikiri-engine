import { Application, Assets, Container, Sprite, Texture } from 'pixi.js'
import { KirikiriLayer } from './KirikiriLayer'

export class KirikiriRenderer {
  private readonly app: Application
  private readonly layers: Record<string, KirikiriLayer> = {}

  constructor(
    private readonly container: HTMLDivElement,
  ) {
    this.app = new Application()
  }

  async init() {
    await this.app.init({
      resizeTo: this.container,
    })

    this.container.appendChild(this.app.canvas)
  }

  async setImage(data: {
    file: string
    layer: string | number
    page: 'back' | 'fore'
    opacity?: number
    x?: number
    y?: number
    visible?: boolean
  }) {
    const { file, layer, page, opacity = 1, x = 0, y = 0, visible = true } = data

    const layerGroup = this.getOrCreateLayer(layer)

    const texture = await Assets.load(file)
    const sprite = new Sprite(texture)

    sprite.width = this.app.screen.width
    sprite.height = this.app.screen.height

    layerGroup.setPage(
      page,
      sprite,
    )
  }

  getOrCreateLayer(layer: string | number): KirikiriLayer {
    if (!this.layers[layer]) {
      this.layers[layer] = new KirikiriLayer(this.app.stage, layer)

      if (typeof layer === 'string') {
        this.app.stage.addChildAt(this.layers[layer], 0)
      }
      else {
        this.app.stage.addChildAt(this.layers[layer], layer + 1)
      }
    }

    return this.layers[layer]
  }

  getLayersArr(): KirikiriLayer[] {
    return Object.values(this.layers)
  }

  transition(name: string) {
    const layers = this.getLayersArr()

    for (const layer of layers) {
      layer.transition(name)
    }
  }
}
