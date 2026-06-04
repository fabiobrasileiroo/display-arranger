import { useState } from "react"
import {
  Check,
  ChevronDown,
  Download,
  FolderOpen,
  MonitorCog,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import * as ipc from "@/lib/ipc"
import type { DisplayManager } from "@/hooks/use-display-manager"

export function Toolbar({ m }: { m: DisplayManager }) {
  const [saveOpen, setSaveOpen] = useState(false)
  const [name, setName] = useState("")
  const [exportOpen, setExportOpen] = useState(false)
  const [script, setScript] = useState("")

  async function openExport() {
    try {
      setScript(await ipc.exportScript(m.currentLayout()))
      setExportOpen(true)
    } catch (e) {
      toast.error(`Export failed: ${e}`)
    }
  }

  async function doSave() {
    if (!name.trim()) return
    try {
      await m.saveProfile(name.trim())
      setSaveOpen(false)
      setName("")
    } catch (e) {
      toast.error(`Save failed: ${e}`)
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-2 border-b bg-background/70 px-4 py-3 backdrop-blur-md supports-backdrop-filter:bg-background/50">
      <div className="mr-2 flex items-center gap-2">
        <MonitorCog className="size-5 text-primary" />
        <span className="font-semibold">Display Arranger</span>
        {m.backend ? (
          <Badge variant="secondary" className="text-[10px] uppercase">
            {m.backend}
          </Badge>
        ) : null}
      </div>

      {/* Profiles */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="size-4" />
            Load profile
            <ChevronDown className="size-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Saved profiles</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {m.profiles.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No profiles yet — arrange your screens and hit “Save profile”.
            </div>
          ) : (
            m.profiles.map((p) => (
              <DropdownMenuItem
                key={p.name}
                className="flex items-center justify-between gap-2"
                onSelect={() => m.applyProfile(p)}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {p.signature.length} screen{p.signature.length === 1 ? "" : "s"}
                  </span>
                </span>
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Delete ${p.name}`}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    m.removeProfile(p.name)
                  }}
                >
                  <Trash2 className="size-3.5" />
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-2">
        {m.dirty ? (
          <Badge variant="outline" className="text-amber-500">
            unsaved changes
          </Badge>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            m.refresh()
            toast.info("Rescanned displays")
          }}
          title="Rescan connected displays"
        >
          <RefreshCw className="size-4" /> Rescan
        </Button>

        <Button variant="ghost" size="sm" onClick={m.reset} disabled={!m.dirty}>
          <RotateCcw className="size-4" /> Reset
        </Button>

        <Button variant="outline" size="sm" onClick={openExport}>
          <Download className="size-4" /> Export
        </Button>

        <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)}>
          <Save className="size-4" /> Save profile
        </Button>

        <Button
          size="sm"
          onClick={() => m.apply(15)}
          disabled={m.applying || m.pendingRevert != null}
        >
          <Check className="size-4" /> Apply
        </Button>
      </div>

      {/* Save profile dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save profile</DialogTitle>
            <DialogDescription>
              Save the current arrangement. It will auto-match these displays:{" "}
              {m.connectedNames.join(", ") || "none"}.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="e.g. desk, mobile, triple"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSave()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export script dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export as shell script</DialogTitle>
            <DialogDescription>
              A standalone xrandr script for this layout — save it to{" "}
              <code>~/.local/bin</code> and bind it to a key.
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
            {script}
          </pre>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(script)
                toast.success("Copied to clipboard")
              }}
            >
              Copy
            </Button>
            <Button onClick={() => setExportOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
