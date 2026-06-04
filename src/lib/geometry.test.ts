import { describe, expect, it } from "vitest"

import {
  boundingBox,
  defaultResolution,
  effectiveSize,
  fitScale,
  normalize,
  outputsToConfigs,
  snapPosition,
} from "./geometry"
import type { Output, OutputConfig } from "./types"

function output(partial: Partial<Output> & { name: string }): Output {
  return {
    name: partial.name,
    connected: partial.connected ?? true,
    primary: partial.primary ?? false,
    enabled: partial.enabled ?? true,
    position: partial.position ?? { x: 0, y: 0 },
    currentMode:
      "currentMode" in partial
        ? partial.currentMode!
        : { width: 1920, height: 1080 },
    rotation: partial.rotation ?? "normal",
    modes: partial.modes ?? [
      { width: 1920, height: 1080, rate: 60, current: true, preferred: true },
      { width: 1280, height: 720, rate: 60, current: false, preferred: false },
    ],
    mmWidth: partial.mmWidth ?? 340,
    mmHeight: partial.mmHeight ?? 190,
  }
}

function config(partial: Partial<OutputConfig> & { name: string }): OutputConfig {
  return {
    name: partial.name,
    enabled: partial.enabled ?? true,
    primary: partial.primary ?? false,
    position: partial.position ?? { x: 0, y: 0 },
    mode: partial.mode ?? { width: 1920, height: 1080 },
    rate: partial.rate ?? 60,
    rotation: partial.rotation ?? "normal",
    scale: partial.scale ?? null,
  }
}

describe("effectiveSize", () => {
  it("swaps width/height when rotated sideways", () => {
    expect(effectiveSize(config({ name: "a", rotation: "left" }))).toEqual({
      w: 1080,
      h: 1920,
    })
    expect(effectiveSize(config({ name: "a", rotation: "normal" }))).toEqual({
      w: 1920,
      h: 1080,
    })
  })
})

describe("boundingBox", () => {
  it("spans enabled outputs only", () => {
    const box = boundingBox([
      config({ name: "a", position: { x: 0, y: 0 } }),
      config({ name: "b", position: { x: 1920, y: 0 } }),
      config({ name: "c", enabled: false, position: { x: 9999, y: 9999 } }),
    ])
    expect(box.width).toBe(3840)
    expect(box.height).toBe(1080)
  })
})

describe("snapPosition", () => {
  it("snaps a near-aligned edge to abut the neighbour", () => {
    const dragged = { x: 1925, y: 8, w: 1920, h: 1080 }
    const others = [{ x: 0, y: 0, w: 1920, h: 1080 }]
    const snapped = snapPosition(dragged, others, 20)
    expect(snapped.x).toBe(1920) // abut right edge of neighbour
    expect(snapped.y).toBe(0) // align top
  })

  it("leaves far positions untouched", () => {
    const dragged = { x: 500, y: 500, w: 1920, h: 1080 }
    const others = [{ x: 0, y: 0, w: 1920, h: 1080 }]
    const snapped = snapPosition(dragged, others, 20)
    expect(snapped).toEqual({ x: 500, y: 500 })
  })
})

describe("normalize", () => {
  it("shifts the arrangement so top-left is (0,0)", () => {
    const out = normalize([
      config({ name: "a", position: { x: -100, y: -50 } }),
      config({ name: "b", position: { x: 1820, y: -50 } }),
    ])
    expect(out[0].position).toEqual({ x: 0, y: 0 })
    expect(out[1].position).toEqual({ x: 1920, y: 0 })
  })
})

describe("outputsToConfigs / defaultResolution", () => {
  it("derives a config from a live output", () => {
    const cfgs = outputsToConfigs([output({ name: "eDP-1", primary: true })])
    expect(cfgs[0]).toMatchObject({
      name: "eDP-1",
      enabled: true,
      primary: true,
      mode: { width: 1920, height: 1080 },
      rate: 60,
    })
  })

  it("falls back to preferred then largest mode", () => {
    const o = output({
      name: "x",
      currentMode: null,
      modes: [
        { width: 1280, height: 720, rate: 60, current: false, preferred: true },
        { width: 1920, height: 1080, rate: 60, current: false, preferred: false },
      ],
    })
    expect(defaultResolution(o)).toEqual({ width: 1280, height: 720 })
  })
})

describe("fitScale", () => {
  it("fits the box within the canvas", () => {
    const box = boundingBox([config({ name: "a" })])
    const scale = fitScale(box, 800, 600)
    expect(scale).toBeGreaterThan(0)
    expect(box.width * scale).toBeLessThanOrEqual(800)
  })
})
