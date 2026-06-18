# Instagrouper 🔖

Your saved Instagram posts, finally searchable. Bulk-import an Instagram data
export, auto-tag everything with Claude, then search and filter — and paste a URL
to add new ones over time.

One deployment serves several people as separate **workspaces**: each person has
their own passphrase and sees only their own posts, all from the same URL. Runs on
free tiers (Vercel + Supabase); tagging runs on your Anthropic API key at roughly
a tenth of a cent per post.

> **Heads up on privacy model:** workspaces are kept apart by the app scoping
> every query to the passphrase's workspace — one database, separated in code, not
> separate databases. A passphrase is the whole identity (no accounts, no reset),
> and you as the operator can always read every workspace directly in Supabase.
> Right for a handful of known people; not a substitute for real auth.

---

## What's here

```
app/
  page.js              The whole UI (search, filter, edit, add)
  layout.js
  api/
    posts/route.js     GET  — list posts
    add/route.js       POST — tag a pasted URL and insert it
    retag/route.js     POST — re-run the tagger on edited text
    update/route.js    POST — save a manual edit
    delete/route.js    POST — remove a post from the database
lib/
  supabase.js          server-side DB client + passphrase→workspace resolver
  claude.js            the tagging prompt + call
scripts/
  tag_posts.py         one-time: tag your export into tagged_posts.json
  load_to_supabase.py  one-time: push tagged_posts.json into Supabase
schema.sql             run this in Supabase once
```

---

## Deployment checklist

Three services, in this order: database first, then code, then the host that
ties them together. About 30 minutes start to finish.

### Stage 1 — Supabase (the database)
- [ ] Create a new project at **supabase.com** and wait for it to finish provisioning.
- [ ] Open **SQL Editor → New query**, paste all of `schema.sql`, and click **Run**.
- [ ] Go to **Project Settings → API** and copy two values: the **Project URL** and
      the **service_role** key (the secret one, *not* anon). Treat service_role like
      a password — it bypasses all security rules.

### Stage 2 — Tag and load your data (Windows PowerShell)
One-time backfill of an existing export. Skip if you'd rather add posts one at a
time in the app.
- [ ] Install deps: `pip install anthropic ftfy requests`
- [ ] Tag the export:
      ```powershell
      $env:ANTHROPIC_API_KEY = "sk-ant-..."
      python scripts\tag_posts.py saved_posts.json      # -> tagged_posts.json
      ```
- [ ] Load into Supabase (the `--workspace` name is required — use your own, e.g. `jay`):
      ```powershell
      $env:SUPABASE_URL = "https://YOURPROJECT.supabase.co"
      $env:SUPABASE_SERVICE_KEY = "your-service_role-key"
      python scripts\load_to_supabase.py tagged_posts.json --workspace jay
      ```
- [ ] Confirm the rows landed under **Table Editor → posts** in Supabase.

### Stage 3 — GitHub (the code)
- [ ] Create a new repo at **github.com** (private is fine).
- [ ] **Add file → Upload files**, then drag in *everything inside* the `stash-next`
      folder (the `app`, `lib`, `scripts` folders plus the root files). Dragging
      folders preserves the structure. Commit.

### Stage 4 — Vercel (the host)
- [ ] At **vercel.com**, sign in with GitHub → **Add New → Project** → import the repo.
- [ ] **Before deploying**, expand **Environment Variables** and add all four:
      - `SUPABASE_URL`
      - `SUPABASE_SERVICE_KEY`
      - `ANTHROPIC_API_KEY`
      - `WORKSPACES` — a one-line JSON map of passphrase → workspace, e.g.
        `{"correct-horse-battery-staple":"jay","purple-saffron-2026":"mom"}`.
        Use long, unguessable passphrases. The workspace names must match what you
        passed to `--workspace` when loading data.
- [ ] Click **Deploy**. Vercel runs `npm install` and builds in the cloud, so npm
      being blocked on your work machine doesn't matter.
- [ ] Open the resulting `…vercel.app` URL, enter your passphrase, and your library
      loads. That URL is the link you share.

Editing later: change files in the GitHub web UI and Vercel auto-redeploys on each
commit.

> **Upgrading an existing table?** If you built your `posts` table before workspaces
> existed, run the **MIGRATION** block at the bottom of `schema.sql` (it adds the
> `workspace` column and stamps your current rows as `jay`).

---

## Already running single-workspace? Migrate to workspaces
If you have a live deployment with your own data already loaded, do this once:

1. **Supabase → SQL Editor:** run the `MIGRATION` block at the bottom of
   `schema.sql`. It adds `workspace`, sets every existing row to `jay`, and swaps
   the unique constraint to `(workspace, fbid)`.
2. **Push the updated code** to GitHub (these files).
3. **Vercel → Environment Variables:** add `WORKSPACES` (e.g.
   `{"your-phrase":"jay"}`) and delete the old `APP_PASSWORD`. Make sure it's
   enabled for Production.
4. **Redeploy** (env-var changes need a fresh deploy). Open the app, enter your
   passphrase — your existing posts load, now inside the `jay` workspace.

## Adding another person (e.g. mom)
No new deployment — just data + a passphrase:

1. **Load their export** into the *same* Supabase project with their workspace name:
   ```powershell
   python scripts\tag_posts.py moms_saved_posts.json
   python scripts\load_to_supabase.py tagged_posts.json --workspace mom
   ```
2. **Add their passphrase** to the `WORKSPACES` env var in Vercel:
   `{"your-phrase":"jay","her-phrase":"mom"}`
3. **Redeploy.** Send her the same URL; she enters her passphrase and sees only
   her recipes. The in-app **Lock** button (top of the page) clears the saved
   passphrase so a shared device can switch workspaces.

## Notes
- Keys are server-side only (no `NEXT_PUBLIC_` prefix); all DB access goes through
  the API routes, scoped to the caller's workspace on every read *and* write.
- The original Instagram caption is stored read-only; edits live in `summary`.
  "Re-tag with AI" regenerates category + tags from the edited text.
- Same Instagram post in two workspaces is fine — dedupe is per `(workspace, fbid)`.
