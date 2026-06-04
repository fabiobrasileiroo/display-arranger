import { Download, Loader2, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { DisplayManager } from "@/hooks/use-display-manager"

/** Shown when a newer release exists on GitHub. One click self-updates the
 * AppImage in place (or opens the release page for deb/rpm builds). */
export function UpdateBanner({ m }: { m: DisplayManager }) {
  if (!m.update) return null

  return (
    <div className="flex items-center gap-3 border-b border-primary/30 bg-primary/10 px-4 py-2 text-sm">
      <Sparkles className="size-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        Version <span className="font-semibold">{m.update.latest}</span> is available
        <span className="text-muted-foreground"> (you have {m.update.current})</span>.
      </span>
      <Button size="sm" onClick={m.runUpdate} disabled={m.updating}>
        {m.updating ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Updating…
          </>
        ) : (
          <>
            <Download className="size-4" />
            {m.update.canSelfUpdate ? "Update & restart" : "Download"}
          </>
        )}
      </Button>
      <Button size="sm" variant="ghost" onClick={m.dismissUpdate} disabled={m.updating}>
        <X className="size-4" />
      </Button>
    </div>
  )
}
