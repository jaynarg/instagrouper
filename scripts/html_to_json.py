"""
html_to_json.py — convert an Instagram "saved posts" HTML export into the same
JSON shape that tag_posts.py expects.

Some people get their Instagram download as HTML instead of JSON. This bridges
that: point it at saved_posts.html and it writes saved_posts_from_html.json,
which you then feed to tag_posts.py exactly like a normal export.

Usage (Windows PowerShell):
    pip install beautifulsoup4
    python scripts\\html_to_json.py mom_saved_posts.html
    # -> saved_posts_from_html.json
    python scripts\\tag_posts.py saved_posts_from_html.json

Each saved post in the HTML is a table whose rows are labelled URL / Caption /
Hashtags / Owner. We read those labels rather than relying on position, so it
keeps working even when some posts omit a row (e.g. no hashtags).
"""

import json
import sys
from datetime import datetime, timezone

from bs4 import BeautifulSoup


def cell_after_label(table, label):
    """Find a <td class=_a6_q>LABEL</td> and return the text of the next cell."""
    for td in table.find_all("td", class_="_a6_q"):
        if td.get_text(strip=True) == label:
            sib = td.find_next_sibling("td")
            if sib:
                return sib.get_text("\n", strip=True)
    return ""


def parse_owner(block):
    """Owner is a nested table with its own URL/Name/Username rows."""
    name = username = ""
    # The Owner section has a header <h2>Owner</h2>; the nearest inner table holds the fields.
    for h2 in block.find_all("h2"):
        if h2.get_text(strip=True) == "Owner":
            inner = h2.find_parent().find("table")
            if inner:
                name = cell_after_label(inner, "Name")
                username = cell_after_label(inner, "Username")
            break
    return name, username


def main():
    infile = sys.argv[1] if len(sys.argv) > 1 else "saved_posts.html"
    outfile = "saved_posts_from_html.json"

    with open(infile, encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    records = []
    # Each saved post is an outer table that has a "URL" row whose value is an <a>.
    for table in soup.find_all("table"):
        url_cell = None
        for td in table.find_all("td", recursive=True):
            if td.get_text(strip=True).startswith("URL"):
                a = td.find("a", href=True)
                if a and "instagram.com" in a["href"]:
                    url_cell = a["href"].strip()
                    break
        if not url_cell:
            continue

        caption = cell_after_label(table, "Caption")

        hashtags = []
        for h2 in table.find_all("h2"):
            if h2.get_text(strip=True) == "Hashtags":
                wrap = h2.find_parent()
                # Only the LEAF _a6-p divs hold individual tags; the wrapper _a6-p
                # would otherwise give us all tag names concatenated together.
                for d in wrap.select("div._a6-p"):
                    if d.find("div", class_="_a6-p"):
                        continue  # not a leaf — skip the wrapper
                    t = d.get_text(strip=True)
                    if t and t.lower() != "name" and " " not in t and len(t) < 60:
                        hashtags.append(t)
                break
        # de-dupe, keep order
        seen = set()
        hashtags = [h for h in hashtags if not (h in seen or seen.add(h))]

        owner_name, owner_username = parse_owner(table)

        # The saved date sits in a sibling div after the post table, e.g.
        # "Jun 18, 2026 1:37 am". Parse it to saved_date + unix timestamp.
        saved_date, ts = None, None
        date_div = table.find_next("div", class_="_a6-o")
        if date_div:
            raw_date = date_div.get_text(strip=True)
            for fmt in ("%b %d, %Y %I:%M %p", "%b %d, %Y"):
                try:
                    dt = datetime.strptime(raw_date, fmt)
                    saved_date = dt.strftime("%Y-%m-%d")
                    ts = int(dt.replace(tzinfo=timezone.utc).timestamp())
                    break
                except ValueError:
                    continue

        records.append({
            "fbid": "",                 # HTML export has no fbid; loader will fall back to URL shortcode
            "timestamp": ts,
            "saved_date": saved_date,
            "url": url_cell,
            "caption": caption,
            "hashtags": hashtags,
            "owner_name": owner_name,
            "owner_username": owner_username,
        })

    # De-dupe by URL (the nested owner tables can cause a post's outer table to match twice)
    seen, deduped = set(), []
    for r in records:
        if r["url"] in seen:
            continue
        seen.add(r["url"])
        deduped.append(r)

    with open(outfile, "w", encoding="utf-8") as f:
        json.dump(deduped, f, indent=2, ensure_ascii=False)

    with_caption = sum(1 for r in deduped if r["caption"])
    print(f"Parsed {len(deduped)} saved posts from {infile}")
    print(f"  with caption:  {with_caption}")
    print(f"  with owner:    {sum(1 for r in deduped if r['owner_username'])}")
    print(f"Wrote {outfile}")


if __name__ == "__main__":
    main()
