//! Display backend abstraction. The rest of the app talks to this trait, never
//! to a specific tool, so a Wayland (`wlr-randr`) backend can be added later
//! without touching the commands or the UI.

use anyhow::Result;

use crate::model::{Layout, Output};

pub mod xrandr;

pub trait DisplayBackend: Send + Sync {
    /// Query all outputs (connected and disconnected) with their modes.
    fn query(&self) -> Result<Vec<Output>>;

    /// Apply a desired layout to the hardware.
    fn apply(&self, layout: &Layout) -> Result<()>;

    /// Render a layout as a standalone shell script the user can reuse
    /// (e.g. bind to a dwm keybinding), without applying it.
    fn export_script(&self, layout: &Layout) -> String;

    /// Human-readable backend name, for diagnostics / the UI.
    fn name(&self) -> &'static str;
}

/// Pick the best available backend for the current session. X11/xrandr today;
/// a wlr-randr backend can be slotted in here when present under Wayland.
pub fn detect() -> Box<dyn DisplayBackend> {
    Box::new(xrandr::XrandrBackend::new())
}
