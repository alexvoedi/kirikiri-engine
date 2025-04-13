import { describe, expect, it, vi } from 'vitest'
import { createCallCommand } from './createCallCommand'

describe('createCallCommand', () => {
  const mockEngine = {
    getFullFilePath: vi.fn(),
    loadFile: vi.fn(),
    logger: {
      debug: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call engine.loadFile with the correct file path when the file exists', async () => {
    mockEngine.getFullFilePath.mockReturnValueOnce('/path/to/script.ks')

    const command = createCallCommand(mockEngine as any)
    await command({ storage: 'script.ks' })

    expect(mockEngine.getFullFilePath).toHaveBeenCalledWith('script.ks')
    expect(mockEngine.loadFile).toHaveBeenCalledWith('/path/to/script.ks')
    expect(mockEngine.logger.debug).not.toHaveBeenCalled()
  })

  it('should throw an error when the file does not exist', async () => {
    mockEngine.getFullFilePath.mockReturnValueOnce(null)

    const command = createCallCommand(mockEngine as any)
    await command({ storage: 'missing.ks' })

    expect(mockEngine.getFullFilePath).toHaveBeenCalledWith('missing.ks')
    expect(mockEngine.loadFile).not.toHaveBeenCalled()
    expect(mockEngine.logger.debug).toHaveBeenCalledWith(
      'Error loading file missing.ks: Error: File missing.ks not found in game files',
    )
  })

  it('should merge defaultProps with props and call engine.loadFile', async () => {
    mockEngine.getFullFilePath.mockReturnValueOnce('/path/to/default-script.ks')

    const command = createCallCommand(mockEngine as any, { storage: 'default-script.ks' })
    await command()

    expect(mockEngine.getFullFilePath).toHaveBeenCalledWith('default-script.ks')
    expect(mockEngine.loadFile).toHaveBeenCalledWith('/path/to/default-script.ks')
    expect(mockEngine.logger.debug).not.toHaveBeenCalled()
  })

  it('should prioritize props over defaultProps when both are provided', async () => {
    mockEngine.getFullFilePath.mockReturnValueOnce('/path/to/override-script.ks')

    const command = createCallCommand(mockEngine as any, { storage: 'default-script.ks' })
    await command({ storage: 'override-script.ks' })

    expect(mockEngine.getFullFilePath).toHaveBeenCalledWith('override-script.ks')
    expect(mockEngine.loadFile).toHaveBeenCalledWith('/path/to/override-script.ks')
    expect(mockEngine.logger.debug).not.toHaveBeenCalled()
  })

  it('should handle zod validation errors gracefully', async () => {
    const command = createCallCommand(mockEngine as any)

    await expect(command({})).rejects.toThrowError()

    expect(mockEngine.getFullFilePath).not.toHaveBeenCalled()
    expect(mockEngine.loadFile).not.toHaveBeenCalled()
    expect(mockEngine.logger.debug).not.toHaveBeenCalled()
  })
})
