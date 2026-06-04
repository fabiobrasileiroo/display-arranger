<div align="center">

# 🖥️ Display Arranger

**A fast, polished GUI to arrange your monitors — built for dwm, i3, bspwm and other minimal window managers.**

Drag your screens into place, set resolution / refresh rate / rotation, save profiles, and never get stuck on a black screen again.

[![Release](https://github.com/fabiobrasileiroo/display-arranger/actions/workflows/release.yml/badge.svg)](https://github.com/fabiobrasileiroo/display-arranger/actions/workflows/release.yml)
[![CI](https://github.com/fabiobrasileiroo/display-arranger/actions/workflows/ci.yml/badge.svg)](https://github.com/fabiobrasileiroo/display-arranger/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## Why?

On a full desktop (GNOME/KDE) you get a nice display settings panel. On a bare window manager like **dwm** you're stuck with `xrandr` scripts and `arandr` — which is dated and **crashes on "ghost" outputs** with the infamous `xrandr: cannot find mode None`.

Display Arranger fixes that with a modern, lightweight native app:

- 🖱️ **Drag-to-arrange canvas** — position your monitors visually, with edge snapping.
- 🎛️ **Per-output controls** — resolution, refresh rate, rotation, primary display, enable/disable.
- ⏱️ **Safe apply with auto-revert** — a bad mode auto-reverts after 15s, so you never get locked on a black screen.
- 👻 **Automatic ghost-output cleanup** — disconnected outputs with stale modes are turned off automatically (goodbye `cannot find mode None`).
- 💾 **Named profiles** — save layouts and auto-match them when you plug/unplug monitors.
- 📜 **Export to shell script** — generate a standalone `xrandr` script to bind to a WM keybinding.
- ⌨️ **Headless CLI** — `display-arranger apply <profile>` works without opening the GUI, perfect for keybindings and hotplug rules.
- 🔌 **Hotplug detection** — the UI refreshes automatically when displays change.

Built with **Tauri + React + shadcn/ui** — a single, small native binary (no bundled Chromium), using your system webview.

## Screenshots

> _Add a screenshot to `screenshots/main.png`._

## Install

### AppImage (any distro)

Download the latest `*.AppImage` from [Releases](https://github.com/fabiobrasileiroo/display-arranger/releases), then:

```sh
chmod +x display-arranger_*_amd64.AppImage
./display-arranger_*_amd64.AppImage
```

### Debian / Ubuntu

```sh
sudo apt install ./display-arranger_*_amd64.deb
```

### Fedora / openSUSE

```sh
sudo dnf install ./display-arranger-*.x86_64.rpm
```

### Arch / Manjaro (AUR)

```sh
yay -S display-arranger        # builds from source
```

> Requires an **X11** session with `xrandr` (the default on dwm, i3, bspwm). Wayland (`wlr-randr`) support is planned.

## CLI usage

Once you've saved profiles in the GUI, drive them from the terminal — ideal for a dwm keybinding:

```sh
display-arranger list            # list saved profiles
display-arranger apply triple    # apply a named profile
display-arranger apply --auto    # apply the profile matching plugged-in displays
```

Example dwm `config.h` binding:

```c
{ MODKEY, XK_p, spawn, SHCMD("display-arranger apply --auto") },
```

## How it works

```
┌─────────────────────────────┐     IPC      ┌──────────────────────────┐
│  React + shadcn/ui frontend  │ ───────────► │  Rust core (Tauri)       │
│  drag canvas · controls      │ ◄─────────── │  DisplayBackend trait    │
└─────────────────────────────┘   events     │   └─ xrandr (X11)        │
                                              │   └─ wlr-randr (planned) │
                                              └──────────────────────────┘
```

The UI never talks to `xrandr` directly — it goes through a `DisplayBackend` trait, so a Wayland backend can be added without touching the frontend.

## Development

```sh
# prerequisites: Rust (rustup), Node.js, and the Tauri Linux deps
# (libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf)

npm install
npm run tauri dev      # run the app in dev mode
npm test               # frontend (geometry) tests
cd src-tauri && cargo test && cargo clippy   # backend tests + lints
```

Building bundles locally:

```sh
npm run tauri build
# If AppImage bundling fails with "failed to run linuxdeploy", your environment
# can't FUSE-mount AppImages — prefix with APPIMAGE_EXTRACT_AND_RUN=1:
APPIMAGE_EXTRACT_AND_RUN=1 npm run tauri build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the project layout and guidelines.

## License

[MIT](LICENSE) © Fábio Brasileiro
