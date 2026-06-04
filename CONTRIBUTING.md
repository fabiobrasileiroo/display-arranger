# Contributing to Display Arranger

Thanks for your interest! This is a small, focused tool — the goal is to make
multi-monitor management on minimal window managers pleasant, not to become a
kitchen-sink app.

## Project layout

```
src/                         React + Tailwind + shadcn/ui frontend
  components/
    canvas/monitor-canvas.tsx  drag-to-arrange canvas
    controls/output-panel.tsx  per-output controls
    toolbar.tsx                profiles / apply / export
    revert-countdown.tsx       auto-revert confirmation dialog
  hooks/use-display-manager.ts state (outputs, draft layout, events)
  lib/
    geometry.ts                pure snapping / layout math (unit-tested)
    ipc.ts                     typed wrappers over Tauri commands
    types.ts                   TS mirror of the Rust model

src-tauri/src/               Rust core
  model.rs                   Output / Mode / Layout structs (serde)
  backend/
    mod.rs                   DisplayBackend trait (the abstraction)
    xrandr.rs                X11 backend: parse `xrandr --query`, build commands
  apply.rs                   apply + auto-revert timer + ghost cleanup
  profiles.rs                TOML profile store + hotplug auto-match
  hotplug.rs                 poll-based output-change detection
  cli.rs                     headless `apply` / `list` subcommands
  commands.rs                #[tauri::command] IPC surface
```

## Architecture rules

- **The frontend never shells out.** All display operations go through Tauri
  commands → the `DisplayBackend` trait. To add Wayland support, implement a
  `WlrBackend` in `src-tauri/src/backend/` and wire it into `backend::detect()`.
- **Keep `geometry.ts` pure** (no React, no Tauri) so it stays unit-testable.
- **Keep TS `types.ts` in sync** with `src-tauri/src/model.rs` (serde camelCase).

## Checks before a PR

```sh
npm run typecheck
npm test
npm run lint
cd src-tauri && cargo test && cargo clippy --all-targets && cargo fmt --check
```

CI runs all of these on every pull request.

## Releasing

Push a tag `vX.Y.Z`. The `release.yml` workflow builds the AppImage, `.deb`, and
`.rpm` via `tauri-action` and attaches them to a draft GitHub Release.
