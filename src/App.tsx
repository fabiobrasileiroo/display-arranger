import { useDisplayManager } from "@/hooks/use-display-manager"
import { Toolbar } from "@/components/toolbar"
import { MonitorCanvas } from "@/components/canvas/monitor-canvas"
import { OutputPanel } from "@/components/controls/output-panel"
import { RevertCountdown } from "@/components/revert-countdown"
import { Toaster } from "@/components/ui/sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function App() {
  const m = useDisplayManager()

  return (
    <div className="flex h-svh flex-col bg-background text-foreground">
      <Toolbar m={m} />

      {m.error ? (
        <div className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {m.error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_340px]">
        <section className="min-h-0 p-4">
          {m.loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Detecting displays…
            </div>
          ) : (
            <MonitorCanvas
              configs={m.draft}
              selected={m.selected}
              onSelect={m.setSelected}
              onMove={m.moveConfig}
            />
          )}
        </section>

        <aside className="min-h-0 border-l">
          <ScrollArea className="h-full">
            <div className="p-4">
              <OutputPanel
                outputs={m.outputs}
                draft={m.draft}
                selected={m.selected}
                onSelect={m.setSelected}
                selectedOutput={m.selectedOutput}
                selectedConfig={m.selectedConfig}
                updateConfig={m.updateConfig}
              />
            </div>
          </ScrollArea>
        </aside>
      </div>

      <RevertCountdown
        deadline={m.pendingRevert}
        onKeep={m.confirm}
        onRevert={m.revert}
      />
      <Toaster />
    </div>
  )
}
