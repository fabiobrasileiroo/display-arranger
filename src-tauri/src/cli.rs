//! Headless command-line mode, so the tool works without opening the GUI —
//! ideal to bind to a dwm/i3 keybinding or a udev hotplug rule once profiles
//! exist.
//!
//!   display-arranger list            list saved profiles
//!   display-arranger apply <name>    apply a named profile
//!   display-arranger apply --auto    apply the profile matching plugged-in displays
//!   display-arranger auto            alias for `apply --auto`

use crate::backend;
use crate::profiles;

const HELP: &str = "\
display-arranger — GUI monitor manager for dwm & friends

USAGE:
  display-arranger                 launch the graphical app
  display-arranger list            list saved profiles
  display-arranger apply <name>    apply a named profile
  display-arranger apply --auto    apply the profile matching connected displays
  display-arranger auto            alias for `apply --auto`
  display-arranger --help          show this help
";

/// Handle CLI subcommands. Returns `Some(exit_code)` when the args were handled
/// in CLI mode, or `None` to fall through and launch the GUI.
pub fn run(args: &[String]) -> Option<i32> {
    match args.first().map(String::as_str) {
        Some("--help") | Some("-h") | Some("help") => {
            println!("{HELP}");
            Some(0)
        }
        Some("list") => Some(cmd_list()),
        Some("auto") => Some(cmd_apply(None)),
        Some("apply") => {
            let name = match args.get(1).map(String::as_str) {
                Some("--auto") | None => None,
                Some(n) => Some(n.to_string()),
            };
            Some(cmd_apply(name))
        }
        _ => None,
    }
}

fn cmd_list() -> i32 {
    match profiles::list() {
        Ok(profiles) if profiles.is_empty() => {
            println!("No profiles saved yet.");
            0
        }
        Ok(profiles) => {
            for p in profiles {
                println!("{:<20} [{}]", p.name, p.signature.join(", "));
            }
            0
        }
        Err(e) => {
            eprintln!("error: {e}");
            1
        }
    }
}

fn cmd_apply(name: Option<String>) -> i32 {
    let backend = backend::detect();

    let profile = match name {
        Some(name) => match profiles::list().map(|ps| ps.into_iter().find(|p| p.name == name)) {
            Ok(Some(p)) => p,
            Ok(None) => {
                eprintln!("error: no profile named '{name}'");
                return 1;
            }
            Err(e) => {
                eprintln!("error: {e}");
                return 1;
            }
        },
        None => {
            // Auto-match against the currently connected outputs.
            let connected: Vec<String> = match backend.query() {
                Ok(outs) => outs
                    .into_iter()
                    .filter(|o| o.connected)
                    .map(|o| o.name)
                    .collect(),
                Err(e) => {
                    eprintln!("error: {e}");
                    return 1;
                }
            };
            match profiles::match_for(&connected) {
                Ok(Some(p)) => p,
                Ok(None) => {
                    eprintln!(
                        "no profile matches the connected displays: {}",
                        connected.join(", ")
                    );
                    return 1;
                }
                Err(e) => {
                    eprintln!("error: {e}");
                    return 1;
                }
            }
        }
    };

    match backend.apply(&profile.layout) {
        Ok(()) => {
            println!("applied profile '{}'", profile.name);
            0
        }
        Err(e) => {
            eprintln!("error applying '{}': {e}", profile.name);
            1
        }
    }
}
