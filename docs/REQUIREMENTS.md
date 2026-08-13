# Fishing Intelligence — Pilot Requirements

## Product goal

Fishing Intelligence is a mobile-first fishing application that captures fishing activity quickly, measures actual exposure to tackle and techniques, and turns personal history into useful recommendations.

The core loop is:

**Fish → Record → Analyze → Recommend → Fish Better → Learn More**

## Pilot platform

- React + TypeScript + Vite
- Progressive Web App
- GitHub source control
- GitHub Actions for tests/build/deployment
- GitHub Pages for the pilot front end
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row Level Security
- OpenStreetMap/Leaflet mapping

## Pilot must support

1. Email/password signup and login.
2. Tackle inventory with lure category and colour.
3. User-defined lakes/rivers/bodies of water.
4. Start and resume a fishing trip.
5. Current lure selection.
6. Fast cast logging: +1, +5, +10, +25.
7. One-tap bite and lost-fish logging.
8. Quick catch entry with species, optional length/weight, disposition, photo, and notes.
9. GPS capture where available without blocking use when unavailable.
10. Private fishing spot markers.
11. End-of-trip history.
12. Exposure-based metrics such as fish/hour and fish/100 casts.
13. Lure and colour performance.
14. Personal recommendation ranking with confidence based on sample size.
15. Fishing map with catch/spot markers.
16. Offline queue for fishing events/catches when Supabase cannot be reached.
17. RLS so one user cannot read or modify another user's fishing data.

## Important analytics principle

Total fish is not enough. Performance must account for exposure.

Example:

- Lure A: 20 fish / 10 hours = 2 fish/hour
- Lure B: 10 fish / 2 hours = 5 fish/hour

The pilot therefore stores lure-selection events, cast batches, bites, catches, and timestamps.

## Privacy

- Fishing locations are private by default.
- No community or public catch map in the pilot.
- Catch photos are stored in a private Supabase Storage bucket.
- The object path begins with the authenticated user's UUID and Storage RLS enforces ownership.

## Out of scope for this pilot

- Public/social sharing
- Paid subscriptions
- AI chat
- Sonar integration
- Native Apple Watch app
- Community fishing intelligence
- Tournament functionality
- Advanced weather/solunar analysis
