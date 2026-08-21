# Fishing Intelligence for iPhone

This is the native SwiftUI companion to the existing React/PWA pilot. It uses the same Supabase Auth users, PostgreSQL tables, row-level security policies, and private `catch-photos` Storage bucket.

## What is included

- Email/password sign in and account creation with an iOS deep-link callback
- Home dashboard and completed-trip fish/hour
- Trip history, start/resume/end, and confirmed trip deletion
- Fast active-fishing controls for casts, bites, hooks, lost fish, catches, lure changes, and private spots
- Catch details, camera/photo library input, and private Supabase photo storage
- Native MapKit catch and fishing-spot map with year filtering
- Tackle add/edit/deactivate, configurable lure categories/colours, favourites, and photos
- Waterway, custom waterway type, fish species, units, and account settings
- Lure rankings, filters, charts, percentages, and corrected strike-to-landed conversion
- XCTest regression coverage for the core analytics math

## First run in Xcode 26.3

1. Open Xcode once and complete any component installation it requests.
2. In Xcode, choose **Xcode → Settings → Locations → Command Line Tools** and select **Xcode 26.3**.
3. Open `FishingIntelligence.xcodeproj`.
4. Wait for Xcode to resolve the official `supabase-swift` package.
5. Open `FishingIntelligence/Resources/SupabaseConfig.plist` and replace `YOUR_PUBLISHABLE_KEY` with the existing web app's Supabase publishable key. Do not use a service-role key.
6. Select the **FishingIntelligence** target → **Signing & Capabilities**, choose your Apple development team, and change the bundle identifier if Xcode says it is unavailable.
7. Choose an iPhone Simulator and press **Run**.

The project URL is already set to the existing pilot project:

`https://ipckhllhrjnnswutqnzm.supabase.co`

## One Supabase dashboard change

In **Supabase → Authentication → URL Configuration → Redirect URLs**, add:

`fishing-intelligence://auth-callback`

Keep the existing GitHub Pages redirect URL as well. The iOS app supplies this callback during sign-up, and SwiftUI handles the returning email-confirmation link.

No database migration is required for this scaffold. It targets the schema and final setup patch already present under the repository's `supabase/` directory.

## Local verification

After the command-line tools are selected, run:

```sh
./ios/FishingIntelligence/scripts/build.sh
```

In Xcode, press **Command-U** to run `AnalyticsEngineTests` in an installed iPhone Simulator.

## Codex and Xcode workflow

Codex and Xcode do not need a plug-in connection to each other. They collaborate through this repository:

1. Codex reads and edits the Swift/Xcode files.
2. Xcode resolves packages, signs, builds, and runs those same files.
3. Codex can use `xcodebuild` for repeatable build checks after Xcode's command-line tools are selected.
4. Changes go through a `codex/…` Git branch and draft pull request before merging into `main`.

The existing PWA remains deployable from the repository root; the native app is isolated under `ios/`.
