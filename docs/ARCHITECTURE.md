# Architecture Notes

## Why an event model?

Fishing analytics need sequence and exposure, not just final totals.

A trip records events such as:

- trip_started
- setup_selected
- casts_recorded
- bite
- fish_lost
- fish_caught
- spot_marked
- trip_ended

Time between setup-selection events gives approximate lure fishing time. Cast batches and catches are directly attributed to the current lure.

## Why HashRouter?

GitHub Pages is static hosting. Hash routing avoids server-side route rewrite requirements while still allowing a multi-screen React application to work under a repository subpath.

## Why Supabase?

The pilot needs authentication, relational data, storage, and browser-safe user isolation without operating a custom server.

Frontend code uses only the Supabase project URL and publishable key. RLS is the authorization boundary.

## Offline model

Fishing events are client-generated with UUIDs. If a network write fails, the same payload is stored in IndexedDB and later upserted by ID. This makes retrying substantially safer than generating a new row during each attempt.

## Future native app

The React/PWA frontend is replaceable. The PostgreSQL schema, Auth identities, RLS rules, storage paths, and event model can stay in place for a Swift/SwiftUI application.
