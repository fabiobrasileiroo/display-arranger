//! Tauri command surface — the typed IPC boundary the React frontend calls.

use tauri::{AppHandle, State};

use crate::apply::AppState;
use crate::model::{Layout, Output};
use crate::profiles::{self, Profile};
use crate::update::{self, UpdateInfo};

#[tauri::command]
pub fn query_outputs(state: State<AppState>) -> Result<Vec<Output>, String> {
    state.backend.query().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn backend_name(state: State<AppState>) -> String {
    state.backend.name().to_string()
}

/// Apply a layout. With `revertSeconds > 0`, arms the auto-revert safety timer
/// and returns the generation id; `null` means applied permanently.
#[tauri::command]
pub fn apply_layout(
    app: AppHandle,
    state: State<AppState>,
    layout: Layout,
    revert_seconds: Option<u64>,
) -> Result<Option<u64>, String> {
    state
        .apply(&app, layout, revert_seconds)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn confirm_layout(state: State<AppState>) {
    state.confirm();
}

#[tauri::command]
pub fn revert_layout(state: State<AppState>) -> Result<bool, String> {
    state.revert().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_script(state: State<AppState>, layout: Layout) -> String {
    state.backend.export_script(&layout)
}

#[tauri::command]
pub fn list_profiles() -> Result<Vec<Profile>, String> {
    profiles::list().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_profile(
    name: String,
    layout: Layout,
    connected: Vec<String>,
) -> Result<Profile, String> {
    profiles::save(&name, layout, &connected).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_profile(name: String) -> Result<(), String> {
    profiles::delete(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn match_profile(connected: Vec<String>) -> Result<Option<Profile>, String> {
    profiles::match_for(&connected).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_update() -> Result<UpdateInfo, String> {
    tauri::async_runtime::spawn_blocking(update::check)
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}

/// Download and install the latest AppImage in place. Caller should prompt a
/// restart afterwards.
#[tauri::command]
pub async fn apply_update() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(update::apply)
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restart_app(app: AppHandle) {
    app.restart();
}
