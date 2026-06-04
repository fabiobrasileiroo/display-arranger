//! Lightweight hotplug detection. Rather than pulling in X11/udev bindings, we
//! poll the backend on a low-frequency interval and emit `outputs-changed` when
//! the set of connected outputs changes. The frontend listens and refreshes.
//! (Backend-agnostic, so it keeps working when a Wayland backend is added.)

use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};

use crate::apply::AppState;

const POLL_INTERVAL: Duration = Duration::from_secs(3);

pub fn spawn(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last = connected_names(&app);
        loop {
            tokio::time::sleep(POLL_INTERVAL).await;
            let now = connected_names(&app);
            if now != last {
                last = now;
                let _ = app.emit("outputs-changed", ());
            }
        }
    });
}

fn connected_names(app: &AppHandle) -> Vec<String> {
    let state = app.state::<AppState>();
    match state.backend.query() {
        Ok(outs) => {
            let mut names: Vec<String> = outs
                .into_iter()
                .filter(|o| o.connected)
                .map(|o| o.name)
                .collect();
            names.sort();
            names
        }
        Err(_) => Vec::new(),
    }
}
