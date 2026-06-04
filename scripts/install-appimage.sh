#!/bin/sh
# Install the Display Arranger AppImage as a native, launchable app:
#   - makes it executable
#   - installs it to ~/.local/bin/display-arranger
#   - extracts its icon and creates a .desktop launcher (shows in menus/rofi/dmenu)
#
# Usage:
#   ./install-appimage.sh [path/to/display-arranger_*.AppImage]
# If no path is given, it looks in the current dir and ~/Downloads.

set -eu

APP="${1:-}"
if [ -z "$APP" ]; then
  APP=$(ls -1 ./display-arranger*.AppImage "$HOME"/Downloads/display-arranger*.AppImage 2>/dev/null | head -n1 || true)
fi
if [ -z "$APP" ] || [ ! -f "$APP" ]; then
  echo "AppImage not found. Pass it explicitly:" >&2
  echo "  $0 ~/Downloads/display-arranger_0.2.0_amd64.AppImage" >&2
  exit 1
fi

BIN_DIR="$HOME/.local/bin"
ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"
DESKTOP_DIR="$HOME/.local/share/applications"
mkdir -p "$BIN_DIR" "$ICON_DIR" "$DESKTOP_DIR"

DEST="$BIN_DIR/display-arranger"
install -m755 "$APP" "$DEST"
echo "✓ installed binary    -> $DEST"

# Extract the icon from the AppImage (works without FUSE).
ICON_DEST="$ICON_DIR/display-arranger.png"
TMP=$(mktemp -d)
(
  cd "$TMP"
  "$DEST" --appimage-extract 'usr/share/icons/*/*/apps/*.png' >/dev/null 2>&1 \
    || "$DEST" --appimage-extract '*.png' >/dev/null 2>&1 || true
)
SRC_ICON=$(find "$TMP" -name '*.png' -printf '%s %p\n' 2>/dev/null | sort -rn | awk 'NR==1{print $2}')
if [ -n "${SRC_ICON:-}" ]; then
  command cp -f "$SRC_ICON" "$ICON_DEST"
  echo "✓ installed icon      -> $ICON_DEST"
  ICON_NAME="display-arranger"
else
  echo "! could not extract icon; launcher will use a generic icon"
  ICON_NAME="preferences-desktop-display"
fi
rm -rf "$TMP"

cat > "$DESKTOP_DIR/display-arranger.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Display Arranger
GenericName=Monitor Manager
Comment=Arrange monitors, set resolution and rotation, save profiles
Exec=$DEST
Icon=$ICON_NAME
Terminal=false
Categories=Utility;Settings;HardwareSettings;
Keywords=monitor;display;screen;xrandr;resolution;arandr;
EOF
echo "✓ created launcher    -> $DESKTOP_DIR/display-arranger.desktop"

update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true

echo
echo "Done! Launch it from your app menu / rofi, or run:  display-arranger"
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo "Note: add ~/.local/bin to your PATH to call it from the terminal." ;;
esac
