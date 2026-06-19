"""
tag_posts.py — Parse an Instagram saved-posts export and auto-tag each post
with Claude.

Usage (Windows PowerShell):
    # one-time install
    pip install anthropic ftfy

    # set your key for the session
    $env:ANTHROPIC_API_KEY = "sk-ant-..."

    # run it
    python tag_posts.py saved_posts_jay.json

Output:
    tagged_posts.json   — clean, tagged records ready for the web UI

Notes:
    * Re-running is cheap: posts already present in tagged_posts.json (matched
      by fbid) are skipped, so you only pay to tag NEW posts. This is exactly
      the behavior the "paste a URL to add one" flow will reuse later.
    * Default model is Haiku (fast + cheap, fine for tagging). Bump to Sonnet
      if you want sharper judgment on ambiguous posts.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

import anthropic

try:
    from ftfy import fix_text  # repairs mojibake like  mom’s -> mom's
except ImportError:
    def fix_text(s):  # graceful fallback if ftfy isn't installed
        return s

MODEL = "claude-haiku-4-5-20251001"   # swap to "claude-sonnet-4-6" for tougher calls
OUTPUT_PATH = "tagged_posts.json"

# Suggested top-level categories. Claude may add its own if nothing fits —
# the list is guidance, not a hard constraint, so the same script works for
# recipes (Mom) and comedy (you) without code changes.
SUGGESTED_CATEGORIES = [
    "Comedy", "Food & Recipes", "Art & Illustration", "Fitness & Wellness",
    "Travel", "Relationships & Life", "Work & Career", "News & Commentary",
]

SYSTEM_PROMPT = """You categorize saved Instagram posts so they can be searched and filtered later.

You will receive a post's caption, hashtags, and the account that posted it. Return ONLY a JSON object (no markdown, no prose, no backticks) with these fields:

{
  "category": "one top-level bucket",
  "content_type": "the format, e.g. Cartoon / Standup clip / Meme / Recipe / Restaurant recommendation / Sketch",
  "tags": ["3-7 lowercase searchable descriptors"],
  "summary": "one short human-readable sentence describing the post"
}

Guidance:
- Prefer one of these categories when it fits: %s. Invent a new one only if none fit.
- The "tags" array is the searchable workhorse. Be specific and useful.
- FOOD/RECIPE RULE: if the post is about food, ALWAYS include the cuisine (e.g. "indian", "mexican") and, when identifiable, the cooking method (e.g. "instant pot", "air fryer", "grilled") as tags.
- COMEDY RULE: include the comedy style as a tag when clear (e.g. "observational", "absurdist", "crowd work", "political satire").
- If the caption is empty, infer from the account name and hashtags.
- summary must be plain and literal — describe what the post IS, not a clever riff.""" % ", ".join(SUGGESTED_CATEGORIES)


def flatten_post(post):
    """Normalize a saved-post record into a clean dict.

    Handles BOTH input shapes:
      * Instagram's raw JSON export (nested 'label_values')
      * already-flattened records from html_to_json.py (url/caption/owner_* keys)
    """
    # Already-flattened (from the HTML converter): pass through, lightly cleaned.
    if "label_values" not in post and ("url" in post or "caption" in post):
        ts = post.get("timestamp")
        saved = post.get("saved_date")
        if not saved and ts:
            saved = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
        return {
            "fbid": post.get("fbid", "") or "",
            "timestamp": ts,
            "saved_date": saved,
            "url": post.get("url", "") or "",
            "caption": fix_text(post.get("caption", "") or ""),
            "hashtags": post.get("hashtags", []) or [],
            "owner_name": fix_text(post.get("owner_name", "") or ""),
            "owner_username": post.get("owner_username", "") or "",
        }

    # Otherwise: Instagram's nested raw export.
    rec = {
        "fbid": post.get("fbid", ""),
        "timestamp": post.get("timestamp"),
        "saved_date": None,
        "url": "",
        "caption": "",
        "hashtags": [],
        "owner_name": "",
        "owner_username": "",
    }
    if rec["timestamp"]:
        rec["saved_date"] = datetime.fromtimestamp(
            rec["timestamp"], tz=timezone.utc
        ).strftime("%Y-%m-%d")

    for lv in post.get("label_values", []):
        label, title = lv.get("label"), lv.get("title")
        if label == "URL" and not rec["url"]:
            rec["url"] = lv.get("value", "")
        elif label == "Caption" and not rec["caption"]:
            rec["caption"] = fix_text(lv.get("value", ""))
        elif title == "Hashtags":
            for d in lv.get("dict", []):
                for dd in d.get("dict", []):
                    if dd.get("label") == "Name":
                        rec["hashtags"].append(dd.get("value", ""))
        elif title == "Owner":
            for d in lv.get("dict", []):
                for dd in d.get("dict", []):
                    if dd.get("label") == "Name":
                        rec["owner_name"] = fix_text(dd.get("value", ""))
                    elif dd.get("label") == "Username":
                        rec["owner_username"] = dd.get("value", "")
    return rec


def tag_one(client, rec):
    """Send one post to Claude and return the tag dict."""
    user_content = (
        f"Account: {rec['owner_name']} (@{rec['owner_username']})\n"
        f"Hashtags: {', '.join(rec['hashtags']) if rec['hashtags'] else '(none)'}\n"
        f"Caption: {rec['caption'] if rec['caption'] else '(no caption — infer from account + hashtags)'}"
    )
    msg = client.messages.create(
        model=MODEL,
        max_tokens=400,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    raw = msg.content[0].text.strip()
    # strip accidental code fences just in case
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    return json.loads(raw)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="path to saved_posts export JSON")
    ap.add_argument("--model", default=MODEL, help="override the model")
    ap.add_argument("--limit", type=int, default=None, help="tag only first N (for testing)")
    args = ap.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("ERROR: set ANTHROPIC_API_KEY first  ->  $env:ANTHROPIC_API_KEY = 'sk-ant-...'")

    with open(args.input, encoding="utf-8") as f:
        raw_posts = json.load(f)
    parsed = [flatten_post(p) for p in raw_posts]

    # Load existing output as a cache so we only tag NEW posts.
    already = {}
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, encoding="utf-8") as f:
            for r in json.load(f):
                already[r["fbid"]] = r

    client = anthropic.Anthropic()
    out, tagged, skipped, failed = [], 0, 0, 0

    for i, rec in enumerate(parsed):
        if args.limit and tagged >= args.limit:
            out.append(rec | already.get(rec["fbid"], {}))
            continue
        if rec["fbid"] in already and "tags" in already[rec["fbid"]]:
            out.append(already[rec["fbid"]])
            skipped += 1
            continue
        try:
            tags = tag_one(client, rec)
            out.append({**rec, **tags})
            tagged += 1
            print(f"[{i+1}/{len(parsed)}] tagged  @{rec['owner_username']:<22} -> {tags.get('category')}")
        except Exception as e:
            out.append(rec)
            failed += 1
            print(f"[{i+1}/{len(parsed)}] FAILED  @{rec['owner_username']:<22} ({e})")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"\nDone. tagged={tagged}  skipped(cached)={skipped}  failed={failed}")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
