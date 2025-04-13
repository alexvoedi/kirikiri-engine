import { describe, expect, it } from 'vitest'
import { KirikiriEngine } from '../KirikiriEngine'
import { createWaitCommand } from './createWaitCommand'

describe('createWaitCommand', () => {
  const engine = new KirikiriEngine({
    container: document.createElement('div'),
    game: {
      root: '',
      entry: '',
      files: {},
    },
  })

  it('should return a function that resolves after the specified time', async () => {
    const props = { time: '100' }
    const commandFunction = createWaitCommand(engine, props)

    expect(commandFunction).toBeInstanceOf(Function)

    const start = Date.now()
    await commandFunction()
    const end = Date.now()

    expect(end - start).toBeGreaterThanOrEqual(100)
  })

  it('should throw an error if "time" is not a valid number string', async () => {
    const invalidProps = { time: 'invalid' }

    const waitCommand = createWaitCommand(engine, invalidProps)

    await expect(waitCommand()).rejects.toThrowError()
  })

  it('should throw an error if "time" is missing', async () => {
    const invalidProps = {}

    const waitCommand = createWaitCommand(engine, invalidProps)

    await expect(waitCommand()).rejects.toThrowError()
  })

  it('should throw an error if additional unexpected properties are provided', async () => {
    const invalidProps = { time: '100', extra: 'unexpected' }

    const waitCommand = createWaitCommand(engine, invalidProps)

    await expect(waitCommand()).rejects.toThrowError()
  })

  it('should resolve correctly with a floating-point time value', async () => {
    const props = { time: '123.4' }
    const commandFunction = createWaitCommand(engine, props)

    const start = Date.now()
    await commandFunction(props)
    const end = Date.now()

    expect(end - start).toBeGreaterThanOrEqual(1)
  })

  it('should handle edge case where time is 0', async () => {
    const props = { time: '0' }
    const commandFunction = createWaitCommand(engine, props)

    const start = Date.now()
    await commandFunction()
    const end = Date.now()

    expect(end - start).toBeGreaterThanOrEqual(0)
  })
})
