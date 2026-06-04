import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

export interface TerminalTab {
  id: string
  label: string
  /** Lines to "type out". Lines starting with "# " render as dim comments,
   * lines starting with "$ " as commands, everything else as output. */
  lines: string[]
}

/**
 * An interactive terminal: pick a distro tab and the install commands type
 * themselves out with a blinking cursor. Re-types when you switch tabs.
 */
export function Terminal({ tabs }: { tabs: TerminalTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const tab = tabs.find((t) => t.id === active) ?? tabs[0]

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#0c0d14] shadow-2xl shadow-black/50">
      {/* Window chrome + tabs */}
      <div className="flex items-center gap-3 border-b border-border/70 bg-bg-soft/40 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-2 flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`relative rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                t.id === active ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {t.id === active ? (
                <motion.span
                  layoutId="term-tab"
                  className="absolute inset-0 rounded-md bg-primary/15 ring-1 ring-primary/30"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              ) : null}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Typed body */}
      <div className="min-h-[168px] px-5 py-4 font-mono text-[13px] leading-relaxed">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Typed lines={tab.lines} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Typed({ lines }: { lines: string[] }) {
  const full = lines.join("\n")
  const [shown, setShown] = useState("")
  const raf = useRef<number | null>(null)

  useEffect(() => {
    setShown("")
    let i = 0
    let last = performance.now()
    const speed = 14 // ms per char (approx)

    const tick = (now: number) => {
      if (now - last >= speed) {
        // advance a few chars per frame for snappiness
        i = Math.min(full.length, i + 2)
        setShown(full.slice(0, i))
        last = now
      }
      if (i < full.length) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [full])

  const done = shown.length >= full.length

  return (
    <pre className="whitespace-pre-wrap break-words">
      {shown.split("\n").map((line, idx) => (
        <div key={idx}>
          {renderLine(line)}
          {idx === shown.split("\n").length - 1 && !done ? <Cursor /> : null}
        </div>
      ))}
      {done ? <Cursor /> : null}
    </pre>
  )
}

function renderLine(line: string) {
  if (line.startsWith("# ")) {
    return <span className="text-muted/70">{line}</span>
  }
  if (line.startsWith("$ ")) {
    return (
      <span>
        <span className="text-primary">$ </span>
        <span className="text-fg">{line.slice(2)}</span>
      </span>
    )
  }
  return <span className="text-muted">{line}</span>
}

function Cursor() {
  return (
    <motion.span
      className="ml-0.5 inline-block h-[1.05em] w-[7px] translate-y-[2px] bg-primary"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
    />
  )
}
