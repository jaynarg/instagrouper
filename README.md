# Instagrouper 🔖

Your saved Instagram posts, finally searchable. Bulk-import an Instagram data
export, auto-tag everything with Claude, then search and filter — and paste a URL
to add new ones over time.

This is built to run **one copy per person** (you, your mom, a friend) on free
tiers: Vercel for the app, Supabase for the database. Tagging runs on your
Anthropic API key and costs roughly a tenth of a cent per post.

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
  supabase.js          server-side DB client + passphrase gate
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
- [ ] Load into Supabase:
      ```powershell
      $env:SUPABASE_URL = "https://YOURPROJECT.supabase.co"
      $env:SUPABASE_SERVICE_KEY = "your-service_role-key"
      python scripts\load_to_supabase.py tagged_posts.json
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
      - `APP_PASSWORD` — a passphrase you choose; gates the app and protects your
        tagging bill. (Leave it out only if you want the app fully open.)
- [ ] Click **Deploy**. Vercel runs `npm install` and builds in the cloud, so npm
      being blocked on your work machine doesn't matter.
- [ ] Open the resulting `…vercel.app` URL, enter your passphrase, and your library
      loads. That URL is the link you share.

Editing later: change files in the GitHub web UI and Vercel auto-redeploys on each
commit.

> **Upgrading an existing table?** If you built your `posts` table from an earlier
> version of `schema.sql`, just run the one-line `ALTER … add column … edited` at
> the bottom of `schema.sql` so the Delete feature works.

---

## Making a copy for someone else
Spin up a separate Supabase project and a separate Vercel deploy (or a second
repo) for each person. Same code, different data and passphrase. Nobody shares a
library, and each person's tagging runs on the same API key — at these volumes,
still pennies.

## Notes
- Keys are server-side only (no `NEXT_PUBLIC_` prefix), so they never reach the
  browser. All database access goes through the API routes.
- The original Instagram caption is stored read-only; your edits live in
  `summary`. "Re-tag with AI" regenerates category + tags from your edited text.
