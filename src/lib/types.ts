// TypeScript mirror of the Rust model (serde camelCase). Keep in sync with
// src-tauri/src/model.rs.

export type Rotation = "normal" | "left" | "right" | "inverted"

export interface Mode {
  width: number
  height: number
  rate: number
  current: boolean
  preferred: boolean
}

export interface Position {
  x: number
  y: number
}

export interface Resolution {
  width: number
  height: number
}

export interface Output {
  name: string
  connected: boolean
  primary: boolean
  enabled: boolean
  position: Position
  currentMode: Resolution | null
  rotation: Rotation
  modes: Mode[]
  mmWidth: number
  mmHeight: number
}

export interface OutputConfig {
  name: string
  enabled: boolean
  primary: boolean
  position: Position
  mode: Resolution | null
  rate: number | null
  rotation: Rotation
  scale: number | null
}

export interface Layout {
  outputs: OutputConfig[]
}

export interface Profile {
  name: string
  signature: string[]
  layout: Layout
}
