#!/bin/bash
set -euo pipefail

if [[ -d /Applications/Xcode_26.3.app ]]; then
  xcode_path=/Applications/Xcode_26.3.app/Contents/Developer
elif [[ -d /Applications/Xcode.app ]]; then
  xcode_path=/Applications/Xcode.app/Contents/Developer
else
  echo "Xcode was not found in /Applications. Move Xcode into Applications, then run this again."
  exit 1
fi

sudo xcode-select --switch "$xcode_path"
sudo xcodebuild -runFirstLaunch
xcodebuild -version
