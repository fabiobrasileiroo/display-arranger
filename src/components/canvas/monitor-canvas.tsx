import { useLayoutEffect, useRef, useState } from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  boundingBox,
  effectiveSize,
  fitScale,
  rectOf,
  snapPosition,
  type Rect,
} from "@/lib/geometry"
import type { OutputConfig } from "@/lib/types"

const SNAP_PX = 12

interface Props {
  configs: OutputConfig[]
  selected: string | null
  onSelect: (name: string) => void
  onMove: (name: string, x: number, y: number) => void
}

/**
 * Drag is optimized to avoid a React re-render per pointermove (which made
 * dragging feel laggy): during a drag we move the dragged DOM node directly
 * via `style.translate`, throttled with requestAnimationFrame, and commit the
 * final position to React state only once on pointerup. Everything needed for
 * the drag (scale, origin, neighbour rects) is snapshotted on pointerdown.
 */
export function MonitorCanvas({ configs, selected, onSelect, onMove }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const dragRef = useRef<{
    name: string
    node: HTMLElement
    pointerX: number
    pointerY: number
    startX: number
    startY: number
    scale: number
    originX: number
    originY: number
    minX: number
    minY: number
    w: number
    h: number
    others: Rect[]
    lastX: number
    lastY: number
    raf: number | null
  } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const enabled = configs.filter((c) => c.enabled && c.mode)
  const box = boundingBox(enabled)
  const scale = fitScale(box, size.w, size.h)
  const originX = (size.w - box.width * scale) / 2
  const originY = (size.h - box.height * scale) / 2

  const screenLeft = (x: number) => originX + (x - box.minX) * scale
  const screenTop = (y: number) => originY + (y - box.minY) * scale

  function onPointerDown(e: React.PointerEvent, c: OutputConfig) {
    e.preventDefault()
    onSelect(c.name)
    const { w, h } = effectiveSize(c)
    dragRef.current = {
      name: c.name,
      node: e.currentTarget as HTMLElement,
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: c.position.x,
      startY: c.position.y,
      scale,
      originX,
      originY,
      minX: box.minX,
      minY: box.minY,
      w,
      h,
      others: enabled.filter((o) => o.name !== c.name).map(rectOf),
      lastX: c.position.x,
      lastY: c.position.y,
      raf: null,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.pointerX) / d.scale
    const dy = (e.clientY - d.pointerY) / d.scale
    const rect: Rect = { x: d.startX + dx, y: d.startY + dy, w: d.w, h: d.h }
    const snapped = snapPosition(rect, d.others, SNAP_PX / d.scale)
    d.lastX = Math.round(snapped.x)
    d.lastY = Math.round(snapped.y)
    // Move the node directly, batched to one update per frame.
    if (d.raf == null) {
      d.raf = requestAnimationFrame(() => {
        d.raf = null
        const left = d.originX + (d.lastX - d.minX) * d.scale
        const top = d.originY + (d.lastY - d.minY) * d.scale
        d.node.style.left = `${left}px`
        d.node.style.top = `${top}px`
      })
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = dragRef.current
    if (d) {
      if (d.raf != null) cancelAnimationFrame(d.raf)
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
      // Commit once — this is the only state update for the whole drag.
      onMove(d.name, d.lastX, d.lastY)
      dragRef.current = null
    }
  }

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden rounded-xl border bg-[radial-gradient(theme(colors.muted.DEFAULT)_1px,transparent_1px)] [background-size:16px_16px]"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {enabled.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No active displays. Enable one from the panel on the right.
        </div>
      ) : null}

      {enabled.map((c, i) => {
        const isSelected = c.name === selected
        const { w, h } = effectiveSize(c)
        return (
          <button
            key={c.name}
            type="button"
            onPointerDown={(e) => onPointerDown(e, c)}
            style={{
              left: screenLeft(c.position.x),
              top: screenTop(c.position.y),
              width: Math.max(w * scale, 56),
              height: Math.max(h * scale, 44),
            }}
            className={cn(
              "absolute flex cursor-grab touch-none select-none flex-col items-center justify-center rounded-lg border-2 text-center shadow-sm backdrop-blur-sm active:cursor-grabbing",
              isSelected
                ? "z-10 border-primary bg-primary/15 ring-2 ring-primary/40"
                : "border-border bg-card/80 hover:border-primary/60",
            )}
          >
            {/* Number badge so you know which screen you're dragging */}
            <span
              className={cn(
                "absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-md text-[11px] font-bold tabular-nums",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <span className="flex items-center gap-1 px-1 text-xs font-semibold leading-tight">
              {c.primary ? (
                <Star className="size-3 fill-current text-amber-400" />
              ) : null}
              {c.name}
            </span>
            {c.mode ? (
              <span className="text-[10px] text-muted-foreground">
                {c.mode.width}×{c.mode.height}
                {c.rotation !== "normal" ? ` · ${c.rotation}` : ""}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
