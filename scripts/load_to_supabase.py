"""
load_to_supabase.py — push tagged_posts.json into your Supabase 'posts' table,
stamped with a workspace name so each person's library stays separate.

Usage (Windows PowerShell):
    pip install requests pip-system-certs
    $env:SUPABASE_URL = "https://YOURPROJECT.supabase.co"     # must be https://
    $env:SUPABASE_SERVICE_KEY = "your-service_role-key"        # NOT the anon key
    python scripts\\load_to_supabase.py tagged_posts.json --workspace mom

--workspace is REQUIRED (e.g. 'jay', 'mom'). It upserts on (workspace, fbid),
so re-running is safe and two people can each save the same Instagram post.
"""

import argparse
import json
import os
import sys
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    sys.exit("ERROR: set SUPABASE_URL and SUPABASE_SERVICE_KEY first.")
if not SUPABASE_URL.startswith("https://"):
    sys.exit(f"ERROR: SUPABASE_URL must start with https:// (got: {SUPABASE_URL})")

ap = argparse.ArgumentParser()
ap.add_argument("infile", nargs="?", default="tagged_posts.json")
ap.add_argument("--workspace", required=True, help="workspace name to stamp these rows with, e.g. mom")
args = ap.parse_args()

with open(args.infile, encoding="utf-8") as f:
    posts = json.load(f)

rows = []
for p in posts:
    if "tags" not in p:
        continue
    rows.append({
        "workspace": args.workspace,
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
        "edited": False,
    })

endpoint = f"{SUPABASE_URL}/rest/v1/posts?on_conflict=workspace,fbid"
headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal",
}

CHUNK = 50
sent = 0
for i in range(0, len(rows), CHUNK):
    batch = rows[i:i + CHUNK]
    r = requests.post(endpoint, headers=headers, data=json.dumps(batch))
    if r.status_code >= 300:
        sys.exit(f"FAILED on batch {i // CHUNK}: {r.status_code} {r.text}")
    sent += len(batch)
    print(f"  upserted {sent}/{len(rows)}")

print(f"\nDone. {sent} posts loaded into workspace '{args.workspace}'.")
