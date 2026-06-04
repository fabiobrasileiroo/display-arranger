import { motion } from "motion/react"
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Download,
  Github,
  Layers,
  MonitorCog,
  MousePointerClick,
  RotateCcw,
  Save,
  TerminalSquare,
  Unplug,
  Wand2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge, Card } from "@/components/ui/card"
import { Reveal } from "@/components/reveal"
import { Terminal, type TerminalTab } from "@/components/terminal"
import { REPO_URL } from "@/lib/utils"
import { formatBytes, formatDate, pickAppImage, useReleases } from "@/lib/github"

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

const FEATURES = [
  { icon: MousePointerClick, title: "Drag to arrange", desc: "Position your monitors visually on a canvas, with edge snapping." },
  { icon: RotateCcw, title: "Safe auto-revert", desc: "A bad mode reverts after 15s — never get stuck on a black screen." },
  { icon: Wand2, title: "Ghost-output fix", desc: "Stale disconnected outputs are cleaned up automatically. No more “cannot find mode None”." },
  { icon: Save, title: "Named profiles", desc: "Save layouts and auto-match them when you plug or unplug screens." },
  { icon: TerminalSquare, title: "Headless CLI", desc: "display-arranger apply <profile> — bind it to a dwm/i3 keybinding." },
  { icon: Unplug, title: "Hotplug aware", desc: "The UI refreshes automatically when your displays change." },
]

const INSTALL_TABS: TerminalTab[] = [
  {
    id: "appimage",
    label: "AppImage",
    lines: [
      "# Portable — works on any distro",
      "$ chmod +x display-arranger-*-linux-amd64.AppImage",
      "$ ./display-arranger-*-linux-amd64.AppImage",
    ],
  },
  {
    id: "alias",
    label: "AppImage + alias",
    lines: [
      "# Keep it in ~/Apps and add a short command",
      "$ mkdir -p ~/Apps",
      "$ mv display-arranger-*.AppImage ~/Apps/display-arranger.AppImage",
      "$ chmod +x ~/Apps/display-arranger.AppImage",
      "$ echo \"alias da='~/Apps/display-arranger.AppImage'\" >> ~/.zshrc",
      "# now just run:  da",
    ],
  },
  {
    id: "native",
    label: "Native app",
    lines: [
      "# Installs to ~/.local/bin + app menu (rofi/dmenu)",
      "$ curl -fsSL https://raw.githubusercontent.com/fabiobrasileiroo/\\",
      "    display-arranger/main/scripts/install-appimage.sh \\",
      "    | sh -s -- display-arranger-*.AppImage",
      "$ display-arranger",
    ],
  },
  {
    id: "debian",
    label: "Debian / Ubuntu",
    lines: ["$ sudo apt install ./display-arranger-*-linux-amd64.deb", "$ display-arranger"],
  },
  {
    id: "fedora",
    label: "Fedora / openSUSE",
    lines: ["$ sudo dnf install ./display-arranger-*-linux-x86_64.rpm", "$ display-arranger"],
  },
  {
    id: "arch",
    label: "Arch / Manjaro",
    lines: ["# from the AUR", "$ yay -S display-arranger", "$ display-arranger"],
  },
  {
    id: "keybind",
    label: "dwm / i3 keybind",
    lines: [
      "# Drive it headless from your WM config",
      "$ display-arranger apply triple",
      "$ display-arranger apply --auto",
    ],
  },
]

export default function App() {
  const { releases, loading, error } = useReleases()
  const latest = releases[0]
  const appimage = pickAppImage(latest)

  return (
    <div className="page-shell min-h-svh">
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
            <a href={`${REPO_URL}/releases`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><Github className="size-4" /> GitHub</Button>
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" className="hero-grid border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-24 text-center">
          <motion.img
            src={asset("logo.svg")}
            alt="Display Arranger"
            className="mx-auto mb-8 size-24 rounded-2xl shadow-2xl shadow-primary/20"
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 12 }}
          />
          <Reveal delay={60}>
            <div className="mb-5 flex flex-wrap justify-center gap-2">
              <Badge>MIT licensed</Badge>
              <Badge>Tauri + React</Badge>
              <Badge>X11 · xrandr</Badge>
              <Badge>Wayland planned</Badge>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Arrange your monitors,{" "}
              <span className="gradient-text">beautifully</span>.
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
              A fast, polished GUI monitor manager for <strong className="text-fg">dwm</strong>,{" "}
              <strong className="text-fg">i3</strong>, <strong className="text-fg">bspwm</strong> and
              other minimal window managers. No bloated desktop required.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <motion.a
                href={appimage ?? `${REPO_URL}/releases/latest`}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button size="lg" className="pulse-glow"><Download className="size-5" /> Download AppImage</Button>
              </motion.a>
              <a href="#install">
                <Button variant="outline" size="lg">Install options <ArrowRight className="size-4" /></Button>
              </a>
            </div>
          </Reveal>
          {latest ? (
            <Reveal delay={340}>
              <p className="mt-4 text-sm text-muted">
                Latest: <span className="text-fg">{latest.tag_name}</span> · {formatDate(latest.published_at)}
              </p>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* Screenshot — drops onto the page like a sheet of paper */}
      <section className="mx-auto -mt-10 max-w-4xl px-5 [perspective:1400px]">
        <motion.div
          className="overflow-hidden rounded-2xl border border-border bg-bg-soft/60 [transform-origin:top_center]"
          initial={{ opacity: 0, y: -90, rotateX: 42, rotateZ: -3, scale: 0.9, boxShadow: "0 0px 0px rgba(0,0,0,0)" }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, rotateZ: 0, scale: 1, boxShadow: "0 40px 80px -30px rgba(0,0,0,0.8)" }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ type: "spring", stiffness: 60, damping: 14, mass: 0.9 }}
        >
          <img src={asset("screenshot.png")} alt="Display Arranger interface" className="w-full" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-5 py-24">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight">Everything you need, nothing you don't</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            Built for people who live in a tiling window manager and just want their screens to behave.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, index) => (
            <Reveal key={f.title} delay={index * 70}>
              <Card>
                <f.icon className="size-6 text-primary" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Install — interactive terminal */}
      <section id="install" className="border-y border-border bg-bg-soft/20">
        <div className="mx-auto max-w-4xl px-5 py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">Install in one line</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted">
              Pick your setup — the commands type themselves out. Requires an X11 session with{" "}
              <code className="text-fg">xrandr</code> (default on dwm, i3, bspwm).
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10">
              <Terminal tabs={INSTALL_TABS} />
            </div>
          </Reveal>
          {appimage ? (
            <Reveal delay={200}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <motion.a href={appimage} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="pulse-glow"><Download className="size-5" /> Get the latest AppImage</Button>
                </motion.a>
                <a href={`${REPO_URL}/releases/latest`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg">All downloads <ArrowRight className="size-4" /></Button>
                </a>
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* Releases / changelog */}
      <section id="releases" className="mx-auto max-w-5xl px-5 py-24">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight">Releases &amp; changelog</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">Pulled live from GitHub.</p>
        </Reveal>

        <div className="mt-12 space-y-5">
          {loading ? (
            <p className="text-center text-muted">Loading releases…</p>
          ) : error ? (
            <Card className="text-center">
              <AlertCircle className="mx-auto size-6 text-amber-400" />
              <p className="mt-2 text-muted">
                Couldn't load releases right now (GitHub API rate limit?).
              </p>
              <a href={`${REPO_URL}/releases`} target="_blank" rel="noreferrer" className="mt-3 inline-block">
                <Button variant="outline" size="sm"><Github className="size-4" /> View releases on GitHub</Button>
              </a>
            </Card>
          ) : releases.length === 0 ? (
            <Card className="text-center">
              <p className="text-muted">No published releases yet.</p>
              <a href={`${REPO_URL}/releases`} target="_blank" rel="noreferrer" className="mt-3 inline-block">
                <Button variant="outline" size="sm"><Github className="size-4" /> View on GitHub</Button>
              </a>
            </Card>
          ) : (
            <>
              {releases.map((r, i) => (
                <Reveal key={r.tag_name} delay={i * 60}>
                  <Card>
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
                          <motion.a
                            key={a.name}
                            href={a.browser_download_url}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Button variant="outline" size="sm">
                              <Download className="size-4" />
                              {a.name.split("-").pop()} · {formatBytes(a.size)}
                            </Button>
                          </motion.a>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                </Reveal>
              ))}
              <Reveal>
                <div className="pt-2 text-center">
                  <a href={`${REPO_URL}/releases`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm">
                      <Github className="size-4" /> View all releases &amp; changelog on GitHub
                    </Button>
                  </a>
                </div>
              </Reveal>
            </>
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
