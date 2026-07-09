import type { EngineState } from '../enums/EngineState'

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface KirikiriInteractionSnapshot {
  type: 'button' | 'link'
  target?: string
  storage?: string
  exp?: string
}

export interface KirikiriRendererNodeSnapshot {
  type: 'container' | 'sprite' | 'text'
  label?: string
  x: number
  y: number
  alpha: number
  visible: boolean
  rotation: number
  scaleX: number
  scaleY: number
  pivotX: number
  pivotY: number
  width?: number
  height?: number
  file?: string
  storage?: string
  frame?: {
    x: number
    y: number
    width: number
    height: number
  }
  text?: string
  style?: Record<string, JsonValue>
  interaction?: KirikiriInteractionSnapshot
  children?: KirikiriRendererNodeSnapshot[]
}

interface KirikiriRendererLayerSnapshot {
  label: string
  zIndex: number
  visible: boolean
  pages: Record<'back' | 'fore', {
    x: number
    y: number
    alpha: number
    visible: boolean
    width?: number
    height?: number
    children: KirikiriRendererNodeSnapshot[]
  }>
}

export interface KirikiriRendererSnapshot {
  currentMessageLayer: 'message0' | 'message1'
  currentMessagePage: 'back' | 'fore'
  textStyleOverrides: Record<string, JsonValue>
  location: {
    x: number
    y: number
  }
  layers: KirikiriRendererLayerSnapshot[]
}

interface KirikiriExecutionCheckpoint {
  file: string
  lineIndex: number
  textOffset: number
}

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
  renderer?: KirikiriRendererSnapshot
  executionCheckpoint?: KirikiriExecutionCheckpoint
}

export interface KirikiriStoredSaveEntry {
  version: 1
  kind: 'slot' | 'snapshot'
  id: string
  createdAt: string
  title: string
  preview: string
  saveGame: KirikiriSaveGame
}
