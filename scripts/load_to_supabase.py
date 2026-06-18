"""
load_to_supabase.py — push tagged_posts.json into your Supabase 'posts' table.

This is the one-time bulk backfill. It upserts on 'fbid', so re-running is safe
(it won't create duplicates, and it'll fill in any newly-tagged posts).

Usage (Windows PowerShell):
    pip install requests
    $env:SUPABASE_URL = "https://YOURPROJECT.supabase.co"
    $env:SUPABASE_SERVICE_KEY = "eyJ...."   # service_role key (Settings -> API)
    python load_to_supabase.py tagged_posts.json

The service_role key bypasses RLS, which is why the bulk load works even though
the public can only read. Keep that key OFF the frontend and out of GitHub.
"""

import json
import os
import sys
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    sys.exit("ERROR: set SUPABASE_URL and SUPABASE_SERVICE_KEY first.")

infile = sys.argv[1] if len(sys.argv) > 1 else "tagged_posts.json"
with open(infile, encoding="utf-8") as f:
    posts = json.load(f)

# Map our tagged records to table columns. Skip any post that never got tagged.
rows = []
for p in posts:
    if "tags" not in p:
        continue
    rows.append({
        "fbid": p.get("fbid"),
        "url": p.get("url"),
        "caption": p.get("caption"),
        "owner_name": p.get("owner_name"),
        "owner_username": p.get("owner_username"),
        "saved_date": p.get("saved_date"),
        "ts": p.get("timestamp"),
        "category": p.get("category"),
        "content_type": p.get("content_type"),
        "tags": p.get("tags", []),
        "summary": p.get("summary"),
    })

endpoint = f"{SUPABASE_URL}/rest/v1/posts?on_conflict=fbid"
headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal",
}

# Send in chunks to stay well under any payload limits.
CHUNK = 50
sent = 0
for i in range(0, len(rows), CHUNK):
    batch = rows[i:i + CHUNK]
    r = requests.post(endpoint, headers=headers, data=json.dumps(batch))
    if r.status_code >= 300:
        sys.exit(f"FAILED on batch {i//CHUNK}: {r.status_code} {r.text}")
    sent += len(batch)
    print(f"  upserted {sent}/{len(rows)}")

print(f"\nDone. {sent} posts in Supabase.")
