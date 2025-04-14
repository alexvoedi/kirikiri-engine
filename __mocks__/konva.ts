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
        setZIndex: vi.fn(),
        children: [
          {
            name: vi.fn(),
            getType: vi.fn().mockReturnValue('Group'),
            destroy: vi.fn(),
            getChildren: vi.fn().mockReturnValue([]),
          },
        ],
      })),
      Image: {
        fromURL: vi.fn((_, callback) => {
          const img = {
            width: vi.fn(),
            height: vi.fn(),
            scaleX: vi.fn(),
            scaleY: vi.fn(),
            setAttrs: vi.fn(),
            cache: vi.fn(),
            filters: vi.fn(),
            red: vi.fn(),
            green: vi.fn(),
            blue: vi.fn(),
          }
          callback(img)
          return img
        }),
      },
      Group: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        children: [
          {
            add: vi.fn(),
            name: vi.fn(),
            getType: vi.fn().mockReturnValue('Group'),
            destroy: vi.fn(),
            getChildren: vi.fn().mockReturnValue([]),
          },
          {
            add: vi.fn(),
            name: vi.fn(),
            getType: vi.fn().mockReturnValue('Group'),
            destroy: vi.fn(),
            getChildren: vi.fn().mockReturnValue([]),
          },
        ],
      })),
      Filters: {
        RGB: vi.fn(),
        Grayscale: vi.fn(),
      },
    },
  }
})
