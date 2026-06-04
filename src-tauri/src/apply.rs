//! Application state and the apply / confirm / auto-revert machinery.
//!
//! Changing display modes can leave you staring at a black screen if a mode is
//! wrong. To make that safe, `apply_layout` snapshots the current arrangement,
//! applies the new one, and arms a timer: if the UI doesn't `confirm_layout`
//! within the grace period, the snapshot is re-applied automatically.

use std::sync::Mutex;
use std::time::Duration;

use anyhow::Result;
use tauri::{AppHandle, Emitter, Manager};

use crate::backend::{self, DisplayBackend};
use crate::model::Layout;

pub struct AppState {
    pub backend: Box<dyn DisplayBackend>,
    pending: Mutex<Pending>,
}

#[derive(Default)]
struct Pending {
    /// The layout to restore if the change is not confirmed.
    snapshot: Option<Layout>,
    /// Bumped on every apply/confirm/revert so stale timers no-op.
    generation: u64,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            backend: backend::detect(),
            pending: Mutex::new(Pending::default()),
        }
    }

    /// Snapshot the live layout for later revert.
    fn snapshot(&self) -> Result<Layout> {
        let outputs = self.backend.query()?;
        Ok(Layout::from_outputs(&outputs))
    }

    /// Apply `layout`. If `revert_seconds` is set, arm an auto-revert timer and
    /// return the generation the UI must pass to `confirm`. Returns `None` when
    /// applied permanently (no timer).
    pub fn apply(
        &self,
        app: &AppHandle,
        layout: Layout,
        revert_seconds: Option<u64>,
    ) -> Result<Option<u64>> {
        let snapshot = self.snapshot()?;
        self.backend.apply(&layout)?;

        let Some(secs) = revert_seconds.filter(|s| *s > 0) else {
            // Permanent apply: clear any pending revert.
            let mut p = self.pending.lock().unwrap();
            p.snapshot = None;
            p.generation += 1;
            return Ok(None);
        };

        let generation = {
            let mut p = self.pending.lock().unwrap();
            p.generation += 1;
            p.snapshot = Some(snapshot);
            p.generation
        };

        let app = app.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(Duration::from_secs(secs)).await;
            let state = app.state::<AppState>();
            let to_revert = {
                let mut p = state.pending.lock().unwrap();
                if p.generation == generation && p.snapshot.is_some() {
                    let snap = p.snapshot.take();
                    p.generation += 1;
                    snap
                } else {
                    None
                }
            };
            if let Some(snap) = to_revert {
                let _ = state.backend.apply(&snap);
                let _ = app.emit("layout-reverted", ());
            }
        });

        Ok(Some(generation))
    }

    /// Confirm the pending change so the auto-revert timer is cancelled.
    pub fn confirm(&self) {
        let mut p = self.pending.lock().unwrap();
        p.snapshot = None;
        p.generation += 1;
    }

    /// Revert immediately to the snapshot taken before the last apply.
    pub fn revert(&self) -> Result<bool> {
        let snapshot = {
            let mut p = self.pending.lock().unwrap();
            p.generation += 1;
            p.snapshot.take()
        };
        match snapshot {
            Some(layout) => {
                self.backend.apply(&layout)?;
                Ok(true)
            }
            None => Ok(false),
        }
    }
}
