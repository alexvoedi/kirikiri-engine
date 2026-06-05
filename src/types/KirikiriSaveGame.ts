import type { EngineState } from '../enums/EngineState'

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface KirikiriSaveGame {
  version: 1
  createdAt: string
  game: {
    entry: string
    root: string
  }
  state: EngineState
  callstack: Array<{
    file: string
    index: number
  }>
  globalScriptContext: {
    kag: {
      clickCount: number
    }
    f: Record<string, JsonValue>
    sf: Record<string, JsonValue>
    tf?: Record<string, JsonValue>
  }
  commandStorage: Record<string, JsonValue>
  macros: Array<{
    name: string
    lines: string[]
    props: Record<string, JsonValue>
  }>
}
