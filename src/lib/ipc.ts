// Typed wrappers over the Tauri command surface (see src-tauri/src/commands.rs).

import { trackedInvoke } from "./tauri"
import type { Layout, Output, Profile } from "./types"

export const queryOutputs = () => trackedInvoke<Output[]>("query_outputs")

export const backendName = () => trackedInvoke<string>("backend_name")

/** Apply a layout. `revertSeconds > 0` arms the auto-revert timer. Returns the
 * generation id, or null when applied permanently. */
export const applyLayout = (layout: Layout, revertSeconds?: number) =>
  trackedInvoke<number | null>("apply_layout", { layout, revertSeconds })

export const confirmLayout = () => trackedInvoke<void>("confirm_layout")

export const revertLayout = () => trackedInvoke<boolean>("revert_layout")

export const exportScript = (layout: Layout) =>
  trackedInvoke<string>("export_script", { layout })

export const listProfiles = () => trackedInvoke<Profile[]>("list_profiles")

export const saveProfile = (name: string, layout: Layout, connected: string[]) =>
  trackedInvoke<Profile>("save_profile", { name, layout, connected })

export const deleteProfile = (name: string) =>
  trackedInvoke<void>("delete_profile", { name })

export const matchProfile = (connected: string[]) =>
  trackedInvoke<Profile | null>("match_profile", { connected })
