# Fishing Intelligence – Enhancement Pack

This pack changes only FOUR GitHub application files and requires NO Supabase SQL migration.

## What this update adds

- User-configurable lure colour values: users can select an existing value or type a new one.
- User-configurable lure type/category values: users can select an existing value or type a new one.
- Lure photo capture/upload using the existing private Supabase `catch-photos` bucket and the existing `lures.photo_path` field.
- Lure thumbnails on My Tackle, Start Fishing, and Change Lure screens.
- Three-dot lure menu now contains Edit lure and Deactivate.
- Edit existing lure details and replace lure photo.
- Expanded Insights:
  - Lure ranking table
  - Lake success
  - Annual success
  - Lake/year success
  - Sortable columns (all except Rank)
  - Top 10 lure chart
  - Selectable chart metric

## Part A – Fix the email confirmation localhost error in Supabase

NO CODE OR SQL IS REQUIRED FOR THIS.

In Supabase:

1. Open your Fishing Intelligence project.
2. Go to **Authentication → URL Configuration**.
3. Set **Site URL** to exactly:

   https://terryrl.github.io/fishing-intelligence-pilot/

4. Under **Redirect URLs**, add:

   https://terryrl.github.io/fishing-intelligence-pilot/

5. Save.

Why: the confirmation was successful, but Supabase was redirecting the browser to its default localhost URL afterward. That is why the account still worked even though the browser showed ERR_CONNECTION_REFUSED.

## Part B – Update GitHub

The ZIP preserves the correct folders. Replace these four files in your repository:

- `src/pages/TacklePage.tsx`
- `src/pages/ChangeLurePage.tsx`
- `src/pages/StartFishingPage.tsx`
- `src/pages/InsightsPage.tsx`

### Browser-only method

For each file:

1. In GitHub, open your `fishing-intelligence-pilot` repository.
2. Browse to the existing file under `src/pages`.
3. Use the edit/replace workflow, or delete the old file and upload the replacement with the exact same filename.
4. Commit to `main`.

You may upload all four replacements in a single commit if GitHub's browser uploader preserves the `src/pages` path. The key requirement is that each replacement ends up at the exact path shown above.

## Part C – Let GitHub rebuild

A commit to `main` should automatically start:

`Test and deploy to GitHub Pages`

Go to **Actions** and wait until the run is green.

If it fails, send the result to ChatGPT; the GitHub connector can inspect the exact failed step.

## Part D – No Supabase SQL update

Do NOT rerun `browser_setup.sql` and do not create new tables.

This enhancement reuses:

- `lures.category` for user-defined lure types
- `lures.primary_colour` for user-defined colours
- `lures.photo_path` for lure photos
- the existing private `catch-photos` Storage bucket

The existing storage policy already restricts files by the authenticated user's UUID at the start of the path, so lure photos remain private to the owner.

## Suggested pilot test

1. Fix Supabase Authentication URL Configuration.
2. Create a test account with a fresh email if available and confirm the email link returns to Fishing Intelligence instead of localhost.
3. Add a lure and type a brand-new lure type not already suggested.
4. Type a brand-new colour not already suggested.
5. Take a lure photo with the phone camera.
6. Save the lure and confirm its thumbnail appears.
7. Use the three-dot menu and confirm both Edit lure and Deactivate appear.
8. Edit the lure and confirm changes persist.
9. Start Fishing and confirm lure thumbnails appear.
10. Change Lure and confirm thumbnails appear.
11. Finish at least one test trip with casts, bites, and catches.
12. Open Insights and test All History, Lake, Year, and Lake/Year views.
13. Tap each table heading and confirm ascending/descending sorting.
14. Change the Top Lures chart metric and confirm the graph changes.
