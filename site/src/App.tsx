import {
  ArrowRight,
  Clock,
  Download,
  Github,
  Layers,
  MonitorCog,
  MousePointerClick,
  RotateCcw,
  Save,
  Terminal,
  Unplug,
  Wand2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge, Card } from "@/components/ui/card"
import { REPO_URL } from "@/lib/utils"
import {
  formatBytes,
  formatDate,
  pickAppImage,
  useReleases,
} from "@/lib/github"

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

const FEATURES = [
  { icon: MousePointerClick, title: "Drag to arrange", desc: "Position your monitors visually on a canvas, with edge snapping." },
  { icon: RotateCcw, title: "Safe auto-revert", desc: "A bad mode reverts after 15s — never get stuck on a black screen." },
  { icon: Wand2, title: "Ghost-output fix", desc: "Stale disconnected outputs are cleaned up automatically. No more “cannot find mode None”." },
  { icon: Save, title: "Named profiles", desc: "Save layouts and auto-match them when you plug or unplug screens." },
  { icon: Terminal, title: "Headless CLI", desc: "display-arranger apply <profile> — bind it to a dwm/i3 keybinding." },
  { icon: Unplug, title: "Hotplug aware", desc: "The UI refreshes automatically when your displays change." },
]

export default function App() {
  const { releases, loading } = useReleases()
  const latest = releases[0]
  const appimage = pickAppImage(latest)

  return (
    <div className="min-h-svh">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg/70 backdrop-blur-md">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <a href="#top" className="flex items-center gap-2 font-semibold">
            <img src={asset("logo.svg")} alt="" className="size-7 rounded-md" />
            Display Arranger
          </a>
          <div className="flex items-center gap-1 text-sm text-muted">
            <a href="#features" className="hidden rounded-md px-3 py-1.5 hover:text-fg sm:block">Features</a>
            <a href="#install" className="hidden rounded-md px-3 py-1.5 hover:text-fg sm:block">Install</a>
            <a href="#releases" className="hidden rounded-md px-3 py-1.5 hover:text-fg sm:block">Releases</a>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><Github className="size-4" /> GitHub</Button>
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" className="hero-grid border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-24 text-center">
          <img src={asset("logo.svg")} alt="Display Arranger" className="mx-auto mb-8 size-24 rounded-2xl shadow-2xl shadow-primary/20" />
          <div className="mb-5 flex justify-center gap-2">
            <Badge>MIT licensed</Badge>
            <Badge>Tauri + React</Badge>
            <Badge>X11 · xrandr</Badge>
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Arrange your monitors,{" "}
            <span className="bg-gradient-to-r from-primary to-fg bg-clip-text text-transparent">beautifully</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            A fast, polished GUI monitor manager for <strong className="text-fg">dwm</strong>,{" "}
            <strong className="text-fg">i3</strong>, <strong className="text-fg">bspwm</strong> and
            other minimal window managers. No bloated desktop required.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href={appimage ?? `${REPO_URL}/releases/latest`} target="_blank" rel="noreferrer">
              <Button size="lg"><Download className="size-5" /> Download AppImage</Button>
            </a>
            <a href="#install">
              <Button variant="outline" size="lg">Install options <ArrowRight className="size-4" /></Button>
            </a>
          </div>
          {latest ? (
            <p className="mt-4 text-sm text-muted">
              Latest: <span className="text-fg">{latest.tag_name}</span> · {formatDate(latest.published_at)}
            </p>
          ) : null}
        </div>
      </section>

      {/* Screenshot */}
      <section className="mx-auto -mt-10 max-w-4xl px-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-soft/60 shadow-2xl shadow-black/40">
          <img src={asset("screenshot.png")} alt="Display Arranger interface" className="w-full" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-5 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">Everything you need, nothing you don't</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted">
          Built for people who live in a tiling window manager and just want their screens to behave.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="border-y border-border bg-bg-soft/20">
        <div className="mx-auto max-w-5xl px-5 py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight">Install</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            Requires an X11 session with <code className="text-fg">xrandr</code> (default on dwm, i3, bspwm).
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <Install title="AppImage (any distro)" lines={[
              "chmod +x display-arranger_*_amd64.AppImage",
              "./display-arranger_*_amd64.AppImage",
            ]} />
            <Install title="Install as a native app" lines={[
              "curl -fsSL https://raw.githubusercontent.com/\\",
              "  fabiobrasileiroo/display-arranger/main/\\",
              "  scripts/install-appimage.sh | sh -s -- *.AppImage",
            ]} />
            <Install title="Debian / Ubuntu" lines={["sudo apt install ./display-arranger_*_amd64.deb"]} />
            <Install title="Fedora / openSUSE" lines={["sudo dnf install ./display-arranger-*.x86_64.rpm"]} />
            <Install title="Arch / Manjaro (AUR)" lines={["yay -S display-arranger"]} />
            <Install title="Drive it from a keybind (dwm/i3)" lines={[
              "display-arranger apply triple",
              "display-arranger apply --auto",
            ]} />
          </div>
        </div>
      </section>

      {/* Releases / changelog */}
      <section id="releases" className="mx-auto max-w-5xl px-5 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">Releases &amp; changelog</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted">Pulled live from GitHub.</p>

        <div className="mt-12 space-y-5">
          {loading ? (
            <p className="text-center text-muted">Loading releases…</p>
          ) : releases.length === 0 ? (
            <Card className="text-center">
              <p className="text-muted">No published releases yet.</p>
              <a href={`${REPO_URL}/releases`} target="_blank" rel="noreferrer" className="mt-3 inline-block">
                <Button variant="outline" size="sm"><Github className="size-4" /> View on GitHub</Button>
              </a>
            </Card>
          ) : (
            releases.map((r, i) => (
              <Card key={r.tag_name}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Layers className="size-5 text-primary" />
                    <h3 className="text-lg font-semibold">{r.name || r.tag_name}</h3>
                    {i === 0 ? <Badge className="border-primary/40 text-primary">latest</Badge> : null}
                    {r.prerelease ? <Badge>pre-release</Badge> : null}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    <Clock className="size-3.5" /> {formatDate(r.published_at)}
                  </span>
                </div>

                {r.body?.trim() ? (
                  <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-bg/60 p-4 text-sm text-muted">
                    {r.body.trim()}
                  </pre>
                ) : null}

                {r.assets.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.assets.map((a) => (
                      <a key={a.name} href={a.browser_download_url}>
                        <Button variant="outline" size="sm">
                          <Download className="size-4" />
                          {a.name.split("-").pop()} · {formatBytes(a.size)}
                        </Button>
                      </a>
                    ))}
                  </div>
                ) : null}
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted sm:flex-row">
          <span className="flex items-center gap-2">
            <MonitorCog className="size-4 text-primary" /> Display Arranger — MIT © Fábio Brasileiro
          </span>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-fg">
            <Github className="size-4" /> Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

function Install({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Card>
      <h3 className="font-semibold">{title}</h3>
      <pre className="mt-3 overflow-auto rounded-lg border border-border bg-bg/60 p-3 text-xs leading-relaxed text-muted">
        {lines.join("\n")}
      </pre>
    </Card>
  )
}
