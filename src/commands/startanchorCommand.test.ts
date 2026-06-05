import { describe, expect, it } from 'vitest'
import { setupEngine } from '../testSetup'
import { startanchorCommand } from './startanchorCommand'

describe('startanchorCommand', () => {
  it('records the current script position as the start anchor', async () => {
    const engine = await setupEngine()
    engine.callstack.push({
      file: 'first',
      lines: ['*titleMenu', '[startanchor]'],
      index: 1,
    })

    await startanchorCommand(engine, {})

    expect(engine.commandStorage.startanchor).toStrictEqual({
      enabled: true,
      file: 'first',
      index: 1,
    })
  })

  it('can disable the start anchor', async () => {
    const engine = await setupEngine()
    engine.callstack.push({
      file: 'first',
      lines: ['[startanchor enabled=false]'],
      index: 0,
    })

    await startanchorCommand(engine, {
      enabled: 'false',
    })

    expect(engine.commandStorage.startanchor).toStrictEqual({
      enabled: false,
      file: undefined,
      index: undefined,
    })
  })
})
