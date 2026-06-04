//! Core data model shared between the Rust backend and the React frontend
//! (via serde -> JSON). Field names use camelCase on the wire to match TS.

use serde::{Deserialize, Serialize};

/// A single mode advertised by an output: a resolution paired with one
/// refresh rate. xrandr lists several rates per resolution, so a 1920x1080
/// output typically yields multiple `Mode` entries.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Mode {
    pub width: u32,
    pub height: u32,
    pub rate: f64,
    /// The rate currently active for this output.
    pub current: bool,
    /// The display's preferred/native mode (the `+` flag in xrandr).
    pub preferred: bool,
}

/// Screen rotation. Mirrors `xrandr --rotate <value>`.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum Rotation {
    #[default]
    Normal,
    Left,
    Right,
    Inverted,
}

impl Rotation {
    pub fn as_xrandr(self) -> &'static str {
        match self {
            Rotation::Normal => "normal",
            Rotation::Left => "left",
            Rotation::Right => "right",
            Rotation::Inverted => "inverted",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "normal" => Some(Rotation::Normal),
            "left" => Some(Rotation::Left),
            "right" => Some(Rotation::Right),
            "inverted" => Some(Rotation::Inverted),
            _ => None,
        }
    }
}

/// The live state of a physical output as reported by the backend.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Output {
    /// Connector name, e.g. "eDP-1", "HDMI-1-0", "DP-1".
    pub name: String,
    /// Whether a display is physically attached.
    pub connected: bool,
    /// Whether this output is the X primary.
    pub primary: bool,
    /// Whether the output is currently driving a mode (has geometry).
    pub enabled: bool,
    /// Top-left position in the virtual screen, in pixels.
    pub position: Position,
    /// Currently active resolution, if enabled.
    pub current_mode: Option<Resolution>,
    pub rotation: Rotation,
    /// All advertised modes (resolution + rate combinations).
    pub modes: Vec<Mode>,
    /// Physical size in millimetres (0 if unknown).
    pub mm_width: u32,
    pub mm_height: u32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

/// Desired configuration for one output, produced by the UI and consumed by
/// `apply`. `enabled = false` turns the output off (also used for ghost
/// cleanup of disconnected outputs that still hold a stale mode).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct OutputConfig {
    pub name: String,
    pub enabled: bool,
    pub primary: bool,
    pub position: Position,
    /// Target resolution; required when `enabled` is true.
    pub mode: Option<Resolution>,
    /// Target refresh rate; falls back to xrandr's default for the mode.
    pub rate: Option<f64>,
    #[serde(default)]
    pub rotation: Rotation,
    /// Optional fractional scale (e.g. 1.25). `None` means 1:1.
    pub scale: Option<f64>,
}

/// A complete desired arrangement across all outputs.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Layout {
    pub outputs: Vec<OutputConfig>,
}

impl Layout {
    /// Build a `Layout` snapshot from the current live outputs, so it can be
    /// re-applied (used for auto-revert and "current" as a starting point).
    pub fn from_outputs(outputs: &[Output]) -> Self {
        let outputs = outputs
            .iter()
            .map(|o| OutputConfig {
                name: o.name.clone(),
                enabled: o.enabled,
                primary: o.primary,
                position: o.position,
                mode: o.current_mode,
                rate: o.modes.iter().find(|m| m.current).map(|m| m.rate),
                rotation: o.rotation,
                scale: None,
            })
            .collect();
        Layout { outputs }
    }
}
