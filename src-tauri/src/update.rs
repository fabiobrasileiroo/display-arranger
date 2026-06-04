//! In-app updates straight from GitHub Releases — no signing server needed.
//!
//! When running as an AppImage, the `$APPIMAGE` env var points at the single
//! file on disk; updating is just "download the new AppImage and replace that
//! file". For .deb/.rpm/dev builds we can't self-replace, so the UI falls back
//! to opening the release page.

use std::fs;
use std::io::Read;
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;

use anyhow::{anyhow, bail, Context, Result};
use serde::Serialize;

const REPO: &str = "fabiobrasileiroo/display-arranger";
const USER_AGENT: &str = "display-arranger-updater";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub current: String,
    pub latest: String,
    /// True when `latest` is a newer semver than `current`.
    pub update_available: bool,
    /// True when running as an AppImage (so we can self-update in place).
    pub can_self_update: bool,
    pub release_url: String,
    pub appimage_url: Option<String>,
}

pub fn current_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

fn appimage_path() -> Option<PathBuf> {
    std::env::var_os("APPIMAGE").map(PathBuf::from)
}

/// Parse a "1.2.3" string into comparable numbers.
fn parse_semver(s: &str) -> (u64, u64, u64) {
    let s = s.trim().trim_start_matches('v');
    let mut it = s
        .split(['.', '-', '+'])
        .filter_map(|p| p.parse::<u64>().ok());
    (
        it.next().unwrap_or(0),
        it.next().unwrap_or(0),
        it.next().unwrap_or(0),
    )
}

fn is_newer(latest: &str, current: &str) -> bool {
    parse_semver(latest) > parse_semver(current)
}

fn fetch_latest() -> Result<serde_json::Value> {
    let url = format!("https://api.github.com/repos/{REPO}/releases/latest");
    let resp = ureq::get(&url)
        .set("User-Agent", USER_AGENT)
        .set("Accept", "application/vnd.github+json")
        .call()
        .context("failed to reach GitHub")?;
    resp.into_json::<serde_json::Value>()
        .context("invalid GitHub response")
}

/// Check GitHub for the latest release and compare with the running version.
pub fn check() -> Result<UpdateInfo> {
    let json = fetch_latest()?;
    let latest = json["tag_name"]
        .as_str()
        .unwrap_or("")
        .trim_start_matches('v')
        .to_string();
    let release_url = json["html_url"].as_str().unwrap_or("").to_string();

    let appimage_url = json["assets"].as_array().and_then(|assets| {
        assets
            .iter()
            .find(|a| {
                a["name"]
                    .as_str()
                    .map(|n| n.ends_with(".AppImage"))
                    .unwrap_or(false)
            })
            .and_then(|a| a["browser_download_url"].as_str())
            .map(String::from)
    });

    let current = current_version();
    Ok(UpdateInfo {
        update_available: !latest.is_empty() && is_newer(&latest, &current),
        can_self_update: appimage_path().is_some() && appimage_url.is_some(),
        current,
        latest,
        release_url,
        appimage_url,
    })
}

/// Download the latest AppImage and replace the currently-running one in place.
/// Only valid when launched as an AppImage. The change takes effect on restart.
pub fn apply() -> Result<()> {
    let target = appimage_path().ok_or_else(|| anyhow!("not running as an AppImage"))?;
    let info = check()?;
    if !info.update_available {
        bail!("already up to date");
    }
    let url = info
        .appimage_url
        .ok_or_else(|| anyhow!("no AppImage asset in the latest release"))?;

    let resp = ureq::get(&url)
        .set("User-Agent", USER_AGENT)
        .call()
        .context("failed to download update")?;

    // Stream to a temp file next to the current AppImage, then atomically swap.
    let tmp = target.with_extension("AppImage.new");
    {
        let mut reader = resp.into_reader();
        let mut out = fs::File::create(&tmp).context("creating temp file")?;
        let mut buf = [0u8; 64 * 1024];
        loop {
            let n = reader.read(&mut buf).context("downloading")?;
            if n == 0 {
                break;
            }
            std::io::Write::write_all(&mut out, &buf[..n]).context("writing update")?;
        }
    }
    fs::set_permissions(&tmp, fs::Permissions::from_mode(0o755)).context("chmod")?;
    fs::rename(&tmp, &target).context("replacing AppImage")?;
    Ok(())
}
