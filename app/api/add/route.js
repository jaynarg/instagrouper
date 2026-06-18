import { NextResponse } from "next/server";
import { getSupabase, authorized, shortcodeFromUrl } from "../../../lib/supabase";
import { tagPost } from "../../../lib/claude";

export const runtime = "nodejs";

export async function POST(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const url = (body.url || "").trim();
  const note = (body.caption || "").trim(); // user's own note / pasted caption
  if (!/instagram\.com\/(p|reel|tv)\//i.test(url)) {
    return NextResponse.json({ error: "Enter a valid Instagram post or reel URL." }, { status: 400 });
  }

  // We can't fetch IG metadata (Meta blocks it), so we tag from the user's note.
  let tags;
  try {
    tags = await tagPost({ caption: note });
  } catch (e) {
    return NextResponse.json({ error: "Tagging failed: " + e.message }, { status: 502 });
  }

  const row = {
    fbid: shortcodeFromUrl(url) || "new-" + Date.now(),
    url,
    caption: note,
    owner_name: "",
    owner_username: "",
    saved_date: new Date().toISOString().slice(0, 10),
    ts: Math.floor(Date.now() / 1000),
    ...tags,
    edited: false,
  };

  const { data, error } = await supabase
    .from("posts")
    .upsert(row, { onConflict: "fbid" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
