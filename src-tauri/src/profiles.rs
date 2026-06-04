//! Named layout profiles, stored as TOML under the user config dir. Each
//! profile records the set of connected outputs it was saved for ("signature"),
//! so the right profile can be auto-matched when monitors are plugged in.

use std::fs;
use std::path::PathBuf;

use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};

use crate::model::Layout;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub name: String,
    /// Sorted list of connected output names this profile targets.
    pub signature: Vec<String>,
    pub layout: Layout,
}

fn profiles_dir() -> Result<PathBuf> {
    let dir = dirs::config_dir()
        .context("could not determine config directory")?
        .join("display-arranger")
        .join("profiles");
    fs::create_dir_all(&dir).with_context(|| format!("creating {}", dir.display()))?;
    Ok(dir)
}

fn slug(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect()
}

pub fn signature_from(connected: &[String]) -> Vec<String> {
    let mut s: Vec<String> = connected.to_vec();
    s.sort();
    s
}

pub fn save(name: &str, layout: Layout, connected: &[String]) -> Result<Profile> {
    if name.trim().is_empty() {
        bail!("profile name cannot be empty");
    }
    let profile = Profile {
        name: name.to_string(),
        signature: signature_from(connected),
        layout,
    };
    let path = profiles_dir()?.join(format!("{}.toml", slug(name)));
    let text = toml::to_string_pretty(&profile).context("serializing profile")?;
    fs::write(&path, text).with_context(|| format!("writing {}", path.display()))?;
    Ok(profile)
}

pub fn list() -> Result<Vec<Profile>> {
    let dir = profiles_dir()?;
    let mut profiles = Vec::new();
    for entry in fs::read_dir(&dir)? {
        let path = entry?.path();
        if path.extension().and_then(|e| e.to_str()) != Some("toml") {
            continue;
        }
        match fs::read_to_string(&path)
            .map_err(anyhow::Error::from)
            .and_then(|t| toml::from_str::<Profile>(&t).map_err(anyhow::Error::from))
        {
            Ok(p) => profiles.push(p),
            Err(e) => log::warn!("skipping bad profile {}: {e}", path.display()),
        }
    }
    profiles.sort_by_key(|p| p.name.to_lowercase());
    Ok(profiles)
}

pub fn delete(name: &str) -> Result<()> {
    let path = profiles_dir()?.join(format!("{}.toml", slug(name)));
    if path.exists() {
        fs::remove_file(&path).with_context(|| format!("removing {}", path.display()))?;
    }
    Ok(())
}

/// Find the profile whose signature exactly matches the connected outputs.
pub fn match_for(connected: &[String]) -> Result<Option<Profile>> {
    let sig = signature_from(connected);
    Ok(list()?.into_iter().find(|p| p.signature == sig))
}
