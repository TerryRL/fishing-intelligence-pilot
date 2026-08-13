# Fishing Intelligence Pilot — Browser-Only Setup

**No Terminal, command line, Git installation, Node installation, npm installation, or Supabase CLI is required on your Mac.**

Everything below is done in a web browser using only:

1. Supabase Dashboard
2. GitHub website
3. GitHub Actions

GitHub's servers will install Node/npm, run the tests, compile the application, and publish it. Supabase's SQL Editor will create the database.

---

## Part A — Create the Supabase project

1. Sign in to Supabase in your browser.
2. Click **New project**.
3. Choose your organization.
4. Project name: `Fishing Intelligence Pilot` (or any name you prefer).
5. Create a strong database password and save it somewhere secure. You do not put this password into GitHub or the web app.
6. Choose a region close to you and create the project.
7. Wait until the project dashboard is ready.

### A1. Create the database from one SQL file

1. In this package, open `supabase/browser_setup.sql` in a text editor or GitHub preview and copy **all** of its contents.
2. In Supabase, click **SQL Editor** in the left navigation.
3. Click **New query**.
4. Paste the entire contents of `browser_setup.sql`.
5. Click **Run**.
6. At the bottom, the final result should show approximately:
   - `species_loaded` = 17
   - `expected_tables_present` = 8
   - `catch_photo_bucket_present` = 1

This creates the tables, indexes, triggers, security policies, storage bucket and fish-species reference data.

### A2. Optional verification

If you want a second check:

1. Open `supabase/browser_verify.sql` from this package.
2. Copy all its contents.
3. In Supabase SQL Editor, create another **New query**.
4. Paste and click **Run**.
5. Confirm the application tables show `rowsecurity = true` and the `catch-photos` bucket exists and is not public.

### A3. Copy the two Supabase values GitHub needs

In Supabase:

1. Open **Project Settings** / **API Keys** (Supabase may also expose these from the project's **Connect** dialog).
2. Copy the **Project URL**. It looks like `https://xxxxxxxx.supabase.co`.
3. Copy the **Publishable key**. It normally begins with `sb_publishable_`.
4. Do **not** copy a Secret key or service-role key into GitHub variables used by this application.

Keep the Project URL and Publishable key handy for Part B.

---

## Part B — Create the GitHub repository

1. Sign in to GitHub in your browser.
2. Click **New repository**.
3. Repository name: `fishing-intelligence-pilot`.
4. For the simplest GitHub Pages pilot, choose **Public**. If your GitHub plan supports Pages from private repositories, you may use Private instead.
5. Do **not** add a README, `.gitignore`, or license because those files are already in the package.
6. Click **Create repository**.

### B1. Add the Supabase settings as GitHub repository variables

Do this **before uploading the code**, so the first GitHub Actions build has everything it needs.

1. In the new repository, click **Settings**.
2. In the left sidebar, open **Secrets and variables** > **Actions**.
3. Select the **Variables** tab.
4. Click **New repository variable**.
5. Create:

   **Name**: `VITE_SUPABASE_URL`
   
   **Value**: your Supabase Project URL

6. Add a second repository variable:

   **Name**: `VITE_SUPABASE_PUBLISHABLE_KEY`
   
   **Value**: your Supabase Publishable key

These are intentionally repository variables, not server secrets. The publishable Supabase key is designed for browser-side use; data protection is enforced by Supabase Row Level Security.

### B2. Configure GitHub Pages

1. Still in the repository, open **Settings**.
2. Click **Pages** in the left sidebar.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Save if GitHub presents a Save button.

You do not need to choose a branch/folder deployment. The included workflow builds and publishes the application.

---

## Part C — Upload the application to GitHub

### C1. Unzip the package using Finder

Double-click `fishing-intelligence-pilot-browser-only.zip` on your Mac. This is ordinary Finder use, not Terminal.

Open the resulting `fishing-intelligence-pilot` folder.

**Important on a Mac:** the `.github` folder begins with a dot, so Finder may hide it. Press **Command + Shift + . (period)** once in Finder to show hidden files/folders before selecting the project contents. The `.github/workflows/deploy.yml` file is essential because it tells GitHub how to build and publish the app. This is only a Finder visibility shortcut; no Terminal is involved.

### C2. Upload all project files/folders

1. Return to the empty GitHub repository page.
2. Click **Add file** > **Upload files**.
3. In Finder, select **everything inside** the `fishing-intelligence-pilot` folder — not the outer folder itself.
4. Drag the selected files and folders onto GitHub's upload area.
5. Confirm that GitHub shows folders/files including:
   - `.github`
   - `src`
   - `public`
   - `supabase`
   - `docs`
   - `package.json`
   - `vite.config.ts`
   - `index.html`
6. Enter a commit message such as `Initial Fishing Intelligence pilot`.
7. Select **Commit directly to the main branch**.
8. Click **Commit changes**.

**Important:** Do not upload the `node_modules` folder if Finder happens to show one. The package prepared for browser upload excludes it. GitHub Actions installs dependencies on GitHub's servers.

---

## Part D — Let GitHub build the application

Uploading/committing the files triggers `.github/workflows/deploy.yml` automatically.

1. In the GitHub repository, click **Actions**.
2. Open **Test and deploy to GitHub Pages**.
3. Watch the job. GitHub — not your Mac — will:
   - check out the files
   - install Node/npm dependencies
   - run the unit tests
   - calculate the GitHub Pages base path
   - compile the React/TypeScript/Vite application
   - publish the finished site to GitHub Pages
4. A successful run shows a green checkmark.
5. Open the deployment URL shown by GitHub, or go to **Settings > Pages** and use **Visit site**.

The address should be similar to:

`https://YOUR-GITHUB-USERNAME.github.io/fishing-intelligence-pilot/`

---

## Part E — Tell Supabase the final website address

This matters for email-confirmation links used during account sign-up.

1. Copy the exact GitHub Pages URL, including the repository path and trailing `/`.
2. Return to Supabase.
3. Open **Authentication** > **URL Configuration**.
4. Set **Site URL** to the exact GitHub Pages address, for example:

   `https://YOUR-GITHUB-USERNAME.github.io/fishing-intelligence-pilot/`

5. Under **Redirect URLs**, add the same exact URL.
6. Save the changes.

If Supabase offers wildcard redirect rules and you later add routes that need them, they can be configured then. For this pilot, start with the exact deployed URL.

---

## Part F — First pilot test

Open the GitHub Pages site in Safari or Chrome.

1. Create an account.
2. If email confirmation is enabled in Supabase, click the confirmation link in the email.
3. Return to the app and log in.
4. Add a body of water.
5. Add at least two lures.
6. Start a fishing trip.
7. Record casts, a bite, and a catch.
8. Change lure.
9. Mark a spot if location permission is allowed.
10. End the trip.
11. Check Trips, Insights, Map and What Should I Use?

For a fuller test, follow `docs/PILOT_TEST_PLAN.md`.

---

# Future code updates — still no Terminal

When I provide replacement or additional files later:

1. Open your GitHub repository.
2. Navigate to the matching folder.
3. Use **Add file > Upload files** for replacement/new files, or open an individual file and use GitHub's pencil/edit button.
4. Commit changes to `main`.
5. GitHub Actions automatically rebuilds and redeploys the site.

If there is a database change, I will provide a new numbered SQL file. You will copy/paste that SQL into **Supabase > SQL Editor** and click **Run**.

That is the deployment model for this project going forward:

**Application files → GitHub website**

**Database SQL → Supabase SQL Editor**

**Build/test/deploy → GitHub Actions**

**No Mac Terminal**
