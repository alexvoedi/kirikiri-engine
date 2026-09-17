import { Assets, Texture } from 'pixi.js'

export function isDeferredAssetUrl(file: string): boolean {
  return file.startsWith('blob:') || file.startsWith('data:')
}

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.decoding = 'async'
  image.src = src

  if (image.complete && image.naturalWidth > 0) {
    return image
  }

  await new Promise<void>((resolve, reject) => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener('error', () => reject(new Error(`Failed to load image ${src}`)), { once: true })
  })

  return image
}

export async function loadTextureFromAssetUrl(file: string): Promise<Texture> {
  if (isDeferredAssetUrl(file)) {
    return Texture.from(await loadImageElement(file))
  }

  const asset = Assets.get(file) ?? await Assets.load(file)

  return asset instanceof Texture
    ? asset
    : Texture.from(asset)
}
