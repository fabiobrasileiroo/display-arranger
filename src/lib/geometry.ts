// Pure geometry helpers for the drag-to-arrange canvas: turning live outputs
// into an editable layout, computing rotated sizes, edge snapping, and fitting
// the arrangement into the canvas. No React / Tauri here so it stays testable.

import type { Output, OutputConfig, Rotation } from "./types"

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

/** Pick a sensible default resolution for an output: current, else preferred,
 * else the largest available. */
export function defaultResolution(output: Output) {
  if (output.currentMode) return output.currentMode
  const preferred = output.modes.find((m) => m.preferred)
  if (preferred) return { width: preferred.width, height: preferred.height }
  const largest = [...output.modes].sort(
    (a, b) => b.width * b.height - a.width * a.height,
  )[0]
  return largest ? { width: largest.width, height: largest.height } : null
}

/** Build the initial editable layout from the live outputs. */
export function outputsToConfigs(outputs: Output[]): OutputConfig[] {
  return outputs.map((o) => {
    const mode = defaultResolution(o)
    const currentRate = o.modes.find((m) => m.current)?.rate ?? null
    return {
      name: o.name,
      // Connected + currently driving a mode stays enabled; everything else off.
      enabled: o.enabled,
      primary: o.primary,
      position: { ...o.position },
      mode,
      rate: currentRate,
      rotation: o.rotation,
      scale: null,
    }
  })
}

/** Effective on-screen size of a config, accounting for rotation (left/right
 * swap width and height). */
export function effectiveSize(config: OutputConfig): { w: number; h: number } {
  const w = config.mode?.width ?? 0
  const h = config.mode?.height ?? 0
  return isSideways(config.rotation) ? { w: h, h: w } : { w, h }
}

export function isSideways(rotation: Rotation): boolean {
  return rotation === "left" || rotation === "right"
}

export function rectOf(config: OutputConfig): Rect {
  const { w, h } = effectiveSize(config)
  return { x: config.position.x, y: config.position.y, w, h }
}

/** Bounding box over the enabled outputs. */
export function boundingBox(configs: OutputConfig[]): BBox {
  const rects = configs.filter((c) => c.enabled).map(rectOf)
  if (rects.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }
  const minX = Math.min(...rects.map((r) => r.x))
  const minY = Math.min(...rects.map((r) => r.y))
  const maxX = Math.max(...rects.map((r) => r.x + r.w))
  const maxY = Math.max(...rects.map((r) => r.y + r.h))
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/** Snap a dragged rect's position to align/abut neighbour edges, per axis,
 * within `threshold` layout pixels. Returns the adjusted {x, y}. */
export function snapPosition(
  dragged: Rect,
  others: Rect[],
  threshold: number,
): { x: number; y: number } {
  const x = snapAxis(
    dragged.x,
    dragged.w,
    others.map((o) => ({ start: o.x, size: o.w })),
    threshold,
  )
  const y = snapAxis(
    dragged.y,
    dragged.h,
    others.map((o) => ({ start: o.y, size: o.h })),
    threshold,
  )
  return { x, y }
}

function snapAxis(
  start: number,
  size: number,
  others: { start: number; size: number }[],
  threshold: number,
): number {
  let best = start
  let bestDist = threshold + 1
  const end = start + size
  for (const o of others) {
    const oStart = o.start
    const oEnd = o.start + o.size
    // Candidate placements for `start`: align-left, align-right, abut-right, abut-left.
    const candidates = [oStart, oEnd - size, oEnd, oStart - size]
    for (const cand of candidates) {
      const dStart = Math.abs(cand - start)
      const dEnd = Math.abs(cand + size - end)
      const dist = Math.min(dStart, dEnd)
      if (dist < bestDist) {
        bestDist = dist
        best = cand
      }
    }
  }
  return bestDist <= threshold ? Math.round(best) : start
}

/** Shift all positions so the arrangement's top-left sits at (0, 0). xrandr
 * dislikes negative positions and gaps below/right of origin. */
export function normalize(configs: OutputConfig[]): OutputConfig[] {
  const box = boundingBox(configs)
  if (box.minX === 0 && box.minY === 0) return configs
  return configs.map((c) =>
    c.enabled
      ? {
          ...c,
          position: { x: c.position.x - box.minX, y: c.position.y - box.minY },
        }
      : c,
  )
}

/** Scale factor to fit the arrangement inside a canvas of the given size. */
export function fitScale(
  box: BBox,
  canvasWidth: number,
  canvasHeight: number,
  padding = 0.88,
): number {
  if (box.width === 0 || box.height === 0) return 0.1
  return (
    Math.min(canvasWidth / box.width, canvasHeight / box.height) * padding
  )
}
