import { useEffect, useState } from "react"

import { REPO } from "./utils"

export interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

export interface Release {
  tag_name: string
  name: string | null
  published_at: string
  html_url: string
  body: string
  prerelease: boolean
  draft: boolean
  assets: ReleaseAsset[]
}

interface State {
  releases: Release[]
  loading: boolean
  error: string | null
}

/** Fetch published releases from the GitHub REST API (no auth needed). */
export function useReleases(): State {
  const [state, setState] = useState<State>({
    releases: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`)
        return r.json()
      })
      .then((data: Release[]) => {
        const published = data.filter((r) => !r.draft)
        setState({ releases: published, loading: false, error: null })
      })
      .catch((e: unknown) => {
        if ((e as Error).name === "AbortError") return
        setState({ releases: [], loading: false, error: String(e) })
      })
    return () => controller.abort()
  }, [])

  return state
}

export function pickAppImage(release: Release | undefined): string | null {
  return release?.assets.find((a) => a.name.endsWith(".AppImage"))?.browser_download_url ?? null
}

export function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
