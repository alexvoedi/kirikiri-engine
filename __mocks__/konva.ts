vi.mock('konva', () => {
  return {
    default: {
      Stage: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        destroy: vi.fn(),
        getLayers: vi.fn().mockReturnValue([]),
        width: vi.fn().mockReturnValue(800),
        height: vi.fn().mockReturnValue(600),
        draw: vi.fn(),
      })),
      Layer: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        name: vi.fn(),
        destroy: vi.fn(),
        getChildren: vi.fn().mockReturnValue([]),
      })),
      Image: {
        fromURL: vi.fn((_, callback) => {
          const img = {
            width: vi.fn(),
            height: vi.fn(),
            scaleX: vi.fn(),
            scaleY: vi.fn(),
          }
          callback(img)
          return img
        }),
      },
    },
  }
})
