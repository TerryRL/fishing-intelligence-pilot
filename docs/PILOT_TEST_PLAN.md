# Fishing Intelligence — Pilot Test Plan

## Goal

Verify that the pilot can record a real fishing session with minimal interaction, preserve the activity in Supabase, calculate exposure-based results, and keep one user's data private from another user.

## A. Setup

- Deploy the schema migrations to Supabase.
- Deploy the PWA to GitHub Pages.
- Create Test User A.
- Create Test User B.
- Allow location access for User A.

## B. Tackle

As User A:

1. Add `Green Pumpkin Ned Rig` as soft plastic / Green Pumpkin.
2. Add `Silver X-Rap` as jerkbait / Silver.
3. Favourite the Ned Rig.
4. Confirm both appear in Tackle.
5. Search for `Silver` and confirm X-Rap appears.

Expected: tackle persists after logout/login.

## C. Fishing trip

1. Start Fishing.
2. Create/select a body of water.
3. Select Smallmouth Bass.
4. Select Green Pumpkin Ned Rig.
5. Start the trip.

Expected: Active Fishing opens and the current lure is obvious.

## D. Fast logging

1. Tap +CAST ten times or use a +10 batch.
2. Tap BITE.
3. Tap CAUGHT.
4. Select Smallmouth Bass.
5. Enter optional length.
6. Select Released.
7. Save.
8. Confirm the app returns to Active Fishing.
9. Confirm Fish increases.
10. Change lure to Silver X-Rap.
11. Log +10 casts.
12. Tap LOST.
13. Tap MARK SPOT.

Expected: routine actions do not open unnecessary forms.

## E. End trip

1. Open End Trip.
2. Verify displayed totals.
3. End trip.

Expected: Trip Detail opens.

## F. History

Confirm Trip Detail shows:

- Body of water
- Duration
- Casts
- Bites
- Fish
- Fish/hour
- Both lures
- Lure exposure
- Catch
- Timeline

## G. Insights

Open Insights.

Confirm:

- total fish
- fish/hour
- casts
- lure ranking
- colour performance

Verify the lure ranking does not depend only on total fish.

## H. Recommendation

Open What Should I Use?

Confirm:

- historical lures appear
- score/ranking appears
- fish/hour appears
- fish/100 casts appears when casts exist
- trip/cast sample size appears
- confidence appears
- no fabricated historical statistics appear

## I. Map

Open Map.

Confirm:

- catch coordinate appears if GPS was available
- marked spot appears
- marker detail is useful

## J. Offline write test

During an active trip:

1. Turn off Wi-Fi/cellular connectivity.
2. Log +5 casts.
3. Log a bite.
4. Log a catch.
5. Confirm the app remains responsive.
6. Restore connectivity.
7. Open Settings and run Check / Sync Now if needed.
8. Refresh the application.

Expected: queued fishing data appears once synced without duplicates.

## K. RLS privacy test

1. Record fishing data as User A.
2. Sign out.
3. Sign in as User B.

Expected for User B:

- User A water bodies are not visible.
- User A lures are not visible.
- User A trips are not visible.
- User A catches are not visible.
- User A spots are not visible.
- User A photos are not accessible through the application.

Then sign back in as User A and confirm the data remains.

## L. Mobile usability

Use the installed PWA outdoors if practical.

Evaluate:

- Can +CAST be hit one-handed?
- Can BITE be recorded immediately?
- Can a normal catch be logged in a few taps?
- Is current lure visible at a glance?
- Is Change Lure fast?
- Is text readable in bright light?
- Are accidental taps frequent?
- Is tapping every cast annoying?

Record any friction before adding advanced features.
