import { describe, expect, it } from 'vitest'
import { KirikiriEngine } from './classes/KirikiriEngine'
import { EngineState } from './enums/EngineState'
import { Loglevel } from './enums/Loglevel'
import * as IndexExports from './index'

describe('index.ts exports', () => {
  it('should export KirikiriEngine', () => {
    expect(IndexExports.KirikiriEngine).toBeDefined()
    expect(IndexExports.KirikiriEngine).toBe(KirikiriEngine)
  })

  it('should export EngineState', () => {
    expect(IndexExports.EngineState).toBeDefined()
    expect(IndexExports.EngineState).toBe(EngineState)
  })

  it('should export Loglevel', () => {
    expect(IndexExports.Loglevel).toBeDefined()
    expect(IndexExports.Loglevel).toBe(Loglevel)
  })
})
