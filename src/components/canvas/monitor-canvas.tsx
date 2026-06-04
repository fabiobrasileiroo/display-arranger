import { useLayoutEffect, useRef, useState } from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  boundingBox,
  effectiveSize,
  fitScale,
  rectOf,
  snapPosition,
} from "@/lib/geometry"
import type { OutputConfig } from "@/lib/types"

const SNAP_PX = 12

interface Props {
  configs: OutputConfig[]
  selected: string | null
  onSelect: (name: string) => void
  onMove: (name: string, x: number, y: number) => void
}

export function MonitorCanvas({ configs, selected, onSelect, onMove }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const dragRef = useRef<{
    name: string
    pointerX: number
    pointerY: number
    startX: number
    startY: number
    scale: number
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

  const toScreen = (c: OutputConfig) => {
    const { w, h } = effectiveSize(c)
    return {
      left: originX + (c.position.x - box.minX) * scale,
      top: originY + (c.position.y - box.minY) * scale,
      width: w * scale,
      height: h * scale,
    }
  }

  function onPointerDown(e: React.PointerEvent, c: OutputConfig) {
    e.preventDefault()
    onSelect(c.name)
    dragRef.current = {
      name: c.name,
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: c.position.x,
      startY: c.position.y,
      scale,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.pointerX) / d.scale
    const dy = (e.clientY - d.pointerY) / d.scale
    const moving = configs.find((c) => c.name === d.name)
    if (!moving) return
    const rect = { ...rectOf(moving), x: d.startX + dx, y: d.startY + dy }
    const others = enabled.filter((c) => c.name !== d.name).map(rectOf)
    const snapped = snapPosition(rect, others, SNAP_PX / d.scale)
    onMove(d.name, Math.round(snapped.x), Math.round(snapped.y))
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragRef.current) {
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }
    dragRef.current = null
  }

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden rounded-xl border bg-[radial-gradient(theme(colors.muted.DEFAULT)_1px,transparent_1px)] [background-size:16px_16px]"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {enabled.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No active displays. Enable one from the panel on the right.
        </div>
      ) : null}

      {enabled.map((c, i) => {
        const s = toScreen(c)
        const isSelected = c.name === selected
        return (
          <button
            key={c.name}
            type="button"
            onPointerDown={(e) => onPointerDown(e, c)}
            style={{
              left: s.left,
              top: s.top,
              width: Math.max(s.width, 56),
              height: Math.max(s.height, 44),
            }}
            className={cn(
              "absolute flex cursor-grab touch-none select-none flex-col items-center justify-center rounded-lg border-2 text-center shadow-sm backdrop-blur-sm transition-colors active:cursor-grabbing",
              isSelected
                ? "border-primary bg-primary/15 ring-2 ring-primary/40"
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
