# Fishing Intelligence for iPhone

This is the native, local-first SwiftUI version of Fishing Intelligence. It does not require an account, Supabase project, hosted database, or internet connection.

## Where the project lives

The working Git repository is stored at:

`~/Documents/Coding/Fishing App/FishingIntelligence`

Open this Xcode project:

`~/Documents/Coding/Fishing App/FishingIntelligence/ios/FishingIntelligence/FishingIntelligence.xcodeproj`

The older web/PWA source remains in the repository for reference, while the native app is isolated under `ios/`.

## Local data design

- Fishing records are stored in a private SwiftData database on the iPhone.
- Catch, lure, and species photos are stored in the app's private Application Support folder.
- No fishing information is sent to a Fishing Intelligence server.
- The app works offline and does not require sign-in.
- Deleting the app also deletes its local data unless the user has saved a backup.

In **More → Settings → Backup & Restore**, **Save a Backup** creates one JSON backup containing both the database and referenced photos. Store it in iCloud Drive, on a Mac, or another safe location. **Restore from Backup** replaces the current on-device records after confirmation.

## What is included

- Home dashboard and completed-trip fish/hour
- Trip history, start/resume/end, and confirmed trip deletion
- Fast active-fishing controls for casts, bites, hooks, lost fish, catches, lure changes, and private spots
- Catch details and camera/photo-library input
- Native MapKit catch and fishing-spot map with year filtering
- Tackle add/edit/deactivate, configurable categories/colours, favourites, and photos
- Waterway, fish species, units, backup, and restore settings
- Lure rankings, filters, charts, percentages, and corrected strike-to-landed conversion
- Automated regression coverage for analytics and local backup persistence

## First run in Xcode 26.3

1. Open Xcode once and complete any component installation it requests.
2. Choose **Xcode → Settings → Locations → Command Line Tools** and select **Xcode 26.3**.
3. Open `FishingIntelligence.xcodeproj` from the Documents path above.
4. Select the **FishingIntelligence** target → **Signing & Capabilities** and choose your Apple development team.
5. Choose an iPhone Simulator and press **Run**.

There is no API key or backend configuration step.

## Verification

After Xcode's command-line tools are selected, run:

```sh
./ios/FishingIntelligence/scripts/build.sh
```

In Xcode, press **Command-U** to run the automated tests in an installed iPhone Simulator.

## Codex and Xcode workflow

Codex and Xcode work on the same repository. Codex edits the project under Documents; Xcode builds and runs those same files. Changes use a `codex/…` Git branch and a draft pull request before merging into `main`.
