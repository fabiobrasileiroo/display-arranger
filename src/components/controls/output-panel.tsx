import { Monitor, MonitorOff, Star } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { boundingBox, defaultResolution } from "@/lib/geometry"
import type { Output, OutputConfig, Resolution, Rotation } from "@/lib/types"

const ROTATIONS: Rotation[] = ["normal", "left", "right", "inverted"]

function formatRate(rate: number): string {
  return Number.isInteger(rate) ? `${rate} Hz` : `${rate.toFixed(2)} Hz`
}

interface Props {
  outputs: Output[]
  draft: OutputConfig[]
  selected: string | null
  onSelect: (name: string) => void
  selectedOutput: Output | null
  selectedConfig: OutputConfig | null
  updateConfig: (name: string, patch: Partial<OutputConfig>) => void
}

export function OutputPanel({
  outputs,
  draft,
  selected,
  onSelect,
  selectedOutput,
  selectedConfig,
  updateConfig,
}: Props) {
  function enableOutput(output: Output, config: OutputConfig) {
    const mode = config.mode ?? defaultResolution(output)
    const rate =
      output.modes
        .filter((m) => m.width === mode?.width && m.height === mode?.height)
        .sort((a, b) => b.rate - a.rate)[0]?.rate ?? null
    // Place the newly enabled output to the right of the current arrangement.
    const box = boundingBox(draft.filter((c) => c.enabled && c.name !== output.name))
    updateConfig(output.name, {
      enabled: true,
      mode,
      rate,
      position: { x: box.maxX, y: 0 },
    })
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Output selector list */}
      <div className="flex flex-col gap-1">
        {outputs.map((o) => {
          const cfg = draft.find((c) => c.name === o.name)
          const active = o.name === selected
          return (
            <button
              key={o.name}
              type="button"
              onClick={() => onSelect(o.name)}
              className={cn(
                "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-accent",
              )}
            >
              <span className="flex items-center gap-2">
                {cfg?.enabled ? (
                  <Monitor className="size-4 text-primary" />
                ) : (
                  <MonitorOff className="size-4 text-muted-foreground" />
                )}
                <span className="font-medium">{o.name}</span>
                {cfg?.primary ? (
                  <Star className="size-3 fill-current text-amber-400" />
                ) : null}
              </span>
              {!o.connected ? (
                <Badge variant="outline" className="text-[10px]">
                  disconnected
                </Badge>
              ) : null}
            </button>
          )
        })}
      </div>

      <Separator />

      {/* Controls for the selected output */}
      {selectedOutput && selectedConfig ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{selectedOutput.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedOutput.connected
                  ? selectedOutput.mmWidth > 0
                    ? `${selectedOutput.mmWidth}×${selectedOutput.mmHeight} mm`
                    : "connected"
                  : "no display attached"}
              </p>
            </div>
            <Switch
              checked={selectedConfig.enabled}
              disabled={!selectedOutput.connected}
              onCheckedChange={(on) =>
                on
                  ? enableOutput(selectedOutput, selectedConfig)
                  : updateConfig(selectedOutput.name, { enabled: false })
              }
            />
          </div>

          {selectedConfig.enabled ? (
            <>
              <ResolutionControl
                output={selectedOutput}
                config={selectedConfig}
                onChange={updateConfig}
              />
              <RotationControl config={selectedConfig} onChange={updateConfig} />
              <div className="flex items-center justify-between">
                <Label htmlFor="primary-switch">Primary display</Label>
                <Switch
                  id="primary-switch"
                  checked={selectedConfig.primary}
                  onCheckedChange={(on) =>
                    updateConfig(selectedOutput.name, { primary: on })
                  }
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {selectedOutput.connected
                ? "Output is off. Toggle the switch to enable it."
                : "Reconnect the display to configure it."}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select an output.</p>
      )}
    </div>
  )
}

function ResolutionControl({
  output,
  config,
  onChange,
}: {
  output: Output
  config: OutputConfig
  onChange: (name: string, patch: Partial<OutputConfig>) => void
}) {
  // Unique resolutions, largest first.
  const seen = new Set<string>()
  const resolutions: Resolution[] = []
  for (const m of [...output.modes].sort(
    (a, b) => b.width * b.height - a.width * a.height,
  )) {
    const key = `${m.width}x${m.height}`
    if (!seen.has(key)) {
      seen.add(key)
      resolutions.push({ width: m.width, height: m.height })
    }
  }
  const rates = output.modes
    .filter(
      (m) => m.width === config.mode?.width && m.height === config.mode?.height,
    )
    .map((m) => m.rate)
    .sort((a, b) => b - a)

  const resKey = config.mode ? `${config.mode.width}x${config.mode.height}` : ""

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label>Resolution</Label>
        <Select
          value={resKey}
          onValueChange={(v) => {
            const [w, h] = v.split("x").map(Number)
            const topRate =
              output.modes
                .filter((m) => m.width === w && m.height === h)
                .sort((a, b) => b.rate - a.rate)[0]?.rate ?? null
            onChange(output.name, { mode: { width: w, height: h }, rate: topRate })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Resolution" />
          </SelectTrigger>
          <SelectContent>
            {resolutions.map((r) => (
              <SelectItem key={`${r.width}x${r.height}`} value={`${r.width}x${r.height}`}>
                {r.width} × {r.height}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Refresh rate</Label>
        <Select
          value={config.rate != null ? config.rate.toFixed(2) : ""}
          onValueChange={(v) => onChange(output.name, { rate: Number(v) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Rate" />
          </SelectTrigger>
          <SelectContent>
            {rates.map((r) => (
              <SelectItem key={r.toFixed(2)} value={r.toFixed(2)}>
                {formatRate(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function RotationControl({
  config,
  onChange,
}: {
  config: OutputConfig
  onChange: (name: string, patch: Partial<OutputConfig>) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>Rotation</Label>
      <Select
        value={config.rotation}
        onValueChange={(v) => onChange(config.name, { rotation: v as Rotation })}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROTATIONS.map((r) => (
            <SelectItem key={r} value={r} className="capitalize">
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
