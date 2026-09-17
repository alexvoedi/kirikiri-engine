import type { Container, Ticker } from 'pixi.js'
import type { AsdAnimation, AsdAnimationFrame } from './AsdAnimation'
import { Rectangle, Sprite, Texture } from 'pixi.js'
import { loadTextureFromAssetUrl } from '../utils/pixiAsset'

interface AsdSpriteAnimationOptions {
  animation?: AsdAnimation | AsdAnimationFrame[]
  fallbackDuration?: number
  file: string
  floatAmplitude?: number
  floatPeriodMs?: number
  label?: string
  placeFrame?: (frame: AsdAnimationFrame, sprite: Sprite) => void
  scale?: number
  zIndex?: number
}

export class AsdSpriteAnimation {
  private sprite?: Sprite
  private animate?: (delta: { elapsedMS?: number, deltaTime: number }) => void

  constructor(
    private readonly container: Container,
    private readonly ticker: Ticker,
  ) {}

  async show(options: AsdSpriteAnimationOptions) {
    this.hide()

    const baseTexture = await loadTextureFromAssetUrl(options.file)
    const fallbackDuration = options.fallbackDuration ?? 100
    const scale = options.scale ?? 1
    const frames = this.resolveFrames(options.animation, baseTexture, fallbackDuration)
    const textures = frames.map(frame => new Texture({
      source: baseTexture.source,
      frame: new Rectangle(frame.sx, frame.sy, frame.sw, frame.sh),
    }))
    const firstFrame = frames[0]
    const sprite = new Sprite({
      label: options.label,
      texture: textures[0] ?? baseTexture,
      width: firstFrame.sw * scale,
      height: firstFrame.sh * scale,
    })

    if (options.zIndex !== undefined) {
      sprite.zIndex = options.zIndex
    }

    const placeFrame = (frame: AsdAnimationFrame) => {
      sprite.width = frame.sw * scale
      sprite.height = frame.sh * scale
      options.placeFrame?.(frame, sprite)
    }

    placeFrame(firstFrame)

    const floatAmplitude = options.floatAmplitude ?? 0
    const floatPeriodMs = options.floatPeriodMs ?? 180
    const baseY = sprite.y
    let elapsed = 0
    let frameIndex = 0

    this.container.sortableChildren = true
    this.container.addChild(sprite)

    const animate = (delta: { elapsedMS?: number, deltaTime: number }) => {
      elapsed += delta.elapsedMS ?? (delta.deltaTime * (1000 / 60))

      if (textures.length > 1) {
        const currentFrame = frames[frameIndex] ?? firstFrame
        const duration = Math.max(currentFrame.duration, 1)
        const nextFrame = Math.floor(elapsed / duration) % textures.length

        if (nextFrame !== frameIndex) {
          frameIndex = nextFrame
          const frame = frames[frameIndex] ?? firstFrame
          sprite.texture = textures[frameIndex] ?? baseTexture
          placeFrame(frame)
        }
      }

      if (floatAmplitude > 0) {
        const frame = frames[frameIndex] ?? firstFrame
        sprite.y = baseY + ((frame.dy - firstFrame.dy) * scale) + Math.sin(elapsed / floatPeriodMs) * floatAmplitude
      }
    }

    this.ticker.add(animate)
    this.sprite = sprite
    this.animate = animate
  }

  hide() {
    if (!this.sprite || !this.animate) {
      return
    }

    this.ticker.remove(this.animate)
    this.sprite.removeFromParent()
    this.sprite.destroy()
    this.sprite = undefined
    this.animate = undefined
  }

  private resolveFrames(
    animation: AsdAnimation | AsdAnimationFrame[] | undefined,
    baseTexture: Texture,
    fallbackDuration: number,
  ): AsdAnimationFrame[] {
    const rawFrames = Array.isArray(animation)
      ? animation
      : animation?.getFrames()

    const frames = (rawFrames?.length
      ? rawFrames
      : [{
          dx: 0,
          dy: 0,
          sx: 0,
          sy: 0,
          sw: baseTexture.width,
          sh: baseTexture.height,
          duration: fallbackDuration,
        }]).filter(frame => (
      frame.sw > 0
      && frame.sh > 0
      && frame.sx >= 0
      && frame.sy >= 0
      && frame.sx + frame.sw <= baseTexture.width
      && frame.sy + frame.sh <= baseTexture.height
    ))

    if (frames.length > 0) {
      return frames.map(frame => ({
        ...frame,
        duration: frame.duration > 0 ? frame.duration : fallbackDuration,
      }))
    }

    return [{
      dx: 0,
      dy: 0,
      sx: 0,
      sy: 0,
      sw: baseTexture.width,
      sh: baseTexture.height,
      duration: fallbackDuration,
    }]
  }
}
