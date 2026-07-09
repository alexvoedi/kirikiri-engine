function createMockContext2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  return {
    canvas,
    font: '',
    drawImage() {},
    getImageData(_x: number, _y: number, width: number, height: number) {
      return {
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height,
      }
    },
    measureText(text: string) {
      return {
        width: text.length * 10,
      }
    },
    putImageData() {},
  } as unknown as CanvasRenderingContext2D
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value(this: HTMLCanvasElement, contextId: string) {
    if (contextId !== '2d') {
      return null
    }

    return createMockContext2d(this)
  },
})
