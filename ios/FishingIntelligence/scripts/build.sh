#!/bin/bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
project_dir="$(cd "$script_dir/.." && pwd)"

xcodebuild \
  build-for-testing \
  -project "$project_dir/FishingIntelligence.xcodeproj" \
  -scheme FishingIntelligence \
  -configuration Debug \
  -destination "generic/platform=iOS Simulator" \
  CODE_SIGNING_ALLOWED=NO
