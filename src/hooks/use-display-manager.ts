import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { listen } from "@tauri-apps/api/event"
import { toast } from "sonner"

import * as ipc from "@/lib/ipc"
import { normalize, outputsToConfigs } from "@/lib/geometry"
import type { Layout, Output, OutputConfig, Profile } from "@/lib/types"

export function useDisplayManager() {
  const [outputs, setOutputs] = useState<Output[]>([])
  const [draft, setDraft] = useState<OutputConfig[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [backend, setBackend] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  // When a layout is applied with auto-revert, this holds the deadline so the
  // UI can show the confirmation countdown.
  const [pendingRevert, setPendingRevert] = useState<number | null>(null)
  // Serialized "clean" layout; `dirty` compares the live draft against it.
  const [baseline, setBaseline] = useState<string>("")
  // Auto-apply the matching saved profile when displays are hotplugged.
  const [autoApply, setAutoApply] = useState(true)
  const [update, setUpdate] = useState<ipc.UpdateInfo | null>(null)
  const [updating, setUpdating] = useState(false)

  const refresh = useCallback(async (): Promise<Output[]> => {
    try {
      const outs = await ipc.queryOutputs()
      setOutputs(outs)
      const configs = outputsToConfigs(outs)
      setDraft(configs)
      setBaseline(JSON.stringify(configs))
      setSelected((prev) =>
        prev && outs.some((o) => o.name === prev)
          ? prev
          : (outs.find((o) => o.connected)?.name ?? outs[0]?.name ?? null),
      )
      setError(null)
      return outs
    } catch (e) {
      setError(String(e))
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const loadProfiles = useCallback(async () => {
    try {
      setProfiles(await ipc.listProfiles())
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Keep a live ref to autoApply so the event listener (registered once) reads
  // the current value without re-subscribing.
  const autoApplyRef = useRef(autoApply)
  useEffect(() => {
    autoApplyRef.current = autoApply
  }, [autoApply])

  useEffect(() => {
    ipc.backendName().then(setBackend).catch(() => {})
    refresh()
    loadProfiles()
    // Non-blocking update check against the latest GitHub release.
    ipc
      .checkUpdate()
      .then((info) => {
        if (info.updateAvailable) setUpdate(info)
      })
      .catch(() => {})

    const unlistenChanged = listen("outputs-changed", async () => {
      const outs = await refresh()
      const connected = outs.filter((o) => o.connected).map((o) => o.name)
      // Try to auto-apply the saved profile that matches the new display set.
      if (autoApplyRef.current) {
        try {
          const match = await ipc.matchProfile(connected)
          if (match) {
            await ipc.applyLayout(match.layout, 0)
            await refresh()
            toast.success(`Displays changed — applied "${match.name}"`)
            return
          }
        } catch (e) {
          console.error(e)
        }
      }
      toast.info("Displays changed — refreshed")
    })
    const unlistenReverted = listen("layout-reverted", () => {
      toast.warning("Reverted to the previous layout")
      setPendingRevert(null)
      refresh()
    })
    return () => {
      unlistenChanged.then((f) => f())
      unlistenReverted.then((f) => f())
    }
  }, [refresh, loadProfiles])

  const connectedNames = useMemo(
    () => outputs.filter((o) => o.connected).map((o) => o.name),
    [outputs],
  )

  const dirty = useMemo(
    () => baseline !== "" && JSON.stringify(draft) !== baseline,
    [draft, baseline],
  )

  const selectedOutput = useMemo(
    () => outputs.find((o) => o.name === selected) ?? null,
    [outputs, selected],
  )
  const selectedConfig = useMemo(
    () => draft.find((c) => c.name === selected) ?? null,
    [draft, selected],
  )

  const updateConfig = useCallback(
    (name: string, patch: Partial<OutputConfig>) => {
      setDraft((prev) =>
        prev.map((c) => {
          if (c.name !== name) {
            // Setting primary on one clears it on the others.
            return patch.primary ? { ...c, primary: false } : c
          }
          return { ...c, ...patch }
        }),
      )
    },
    [],
  )

  const moveConfig = useCallback((name: string, x: number, y: number) => {
    setDraft((prev) =>
      prev.map((c) => (c.name === name ? { ...c, position: { x, y } } : c)),
    )
  }, [])

  const currentLayout = useCallback(
    (): Layout => ({ outputs: normalize(draft) }),
    [draft],
  )

  const apply = useCallback(
    async (revertSeconds = 15) => {
      setApplying(true)
      try {
        await ipc.applyLayout(currentLayout(), revertSeconds)
        if (revertSeconds > 0) {
          setPendingRevert(Date.now() + revertSeconds * 1000)
        }
        await refresh()
      } catch (e) {
        toast.error(`Apply failed: ${e}`)
      } finally {
        setApplying(false)
      }
    },
    [currentLayout, refresh],
  )

  const confirm = useCallback(async () => {
    await ipc.confirmLayout()
    setPendingRevert(null)
    toast.success("Layout kept")
  }, [])

  const revert = useCallback(async () => {
    await ipc.revertLayout()
    setPendingRevert(null)
    await refresh()
  }, [refresh])

  const reset = useCallback(() => {
    if (baseline) setDraft(JSON.parse(baseline))
  }, [baseline])

  const saveProfile = useCallback(
    async (name: string) => {
      await ipc.saveProfile(name, currentLayout(), connectedNames)
      await loadProfiles()
      toast.success(`Saved profile "${name}"`)
    },
    [currentLayout, connectedNames, loadProfiles],
  )

  const applyProfile = useCallback(
    (profile: Profile) => {
      setDraft(profile.layout.outputs)
      toast.info(`Loaded "${profile.name}" — review and Apply`)
    },
    [],
  )

  const removeProfile = useCallback(
    async (name: string) => {
      await ipc.deleteProfile(name)
      await loadProfiles()
    },
    [loadProfiles],
  )

  const runUpdate = useCallback(async () => {
    if (!update) return
    if (!update.canSelfUpdate) {
      // deb/rpm/dev build — open the release page instead.
      window.open(update.releaseUrl, "_blank")
      return
    }
    setUpdating(true)
    try {
      await ipc.applyUpdate()
      toast.success("Update installed — restarting…")
      setTimeout(() => ipc.restartApp().catch(() => {}), 1200)
    } catch (e) {
      toast.error(`Update failed: ${e}`)
      setUpdating(false)
    }
  }, [update])

  const dismissUpdate = useCallback(() => setUpdate(null), [])

  return {
    autoApply,
    setAutoApply,
    update,
    updating,
    runUpdate,
    dismissUpdate,
    outputs,
    draft,
    selected,
    setSelected,
    selectedOutput,
    selectedConfig,
    profiles,
    backend,
    loading,
    error,
    applying,
    dirty,
    pendingRevert,
    connectedNames,
    refresh,
    updateConfig,
    moveConfig,
    currentLayout,
    apply,
    confirm,
    revert,
    reset,
    saveProfile,
    applyProfile,
    removeProfile,
  }
}

export type DisplayManager = ReturnType<typeof useDisplayManager>
