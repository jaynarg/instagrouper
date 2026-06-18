import { NextResponse } from "next/server";
import { getSupabase, resolveWorkspace } from "../../../lib/supabase";
import { tagPost } from "../../../lib/claude";

export const runtime = "nodejs";

export async function POST(req) {
  const workspace = resolveWorkspace(req);
  if (!workspace) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { id, text, owner_username = "", owner_name = "" } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let tags;
  try {
    tags = await tagPost({ caption: text || "", owner_username, owner_name });
  } catch (e) {
    return NextResponse.json({ error: "Tagging failed: " + e.message }, { status: 502 });
  }

  // Scope the update to this workspace so a row id from elsewhere can't be touched.
  const { data, error } = await supabase
    .from("posts")
    .update({ ...tags, edited: false })
    .eq("id", id)
    .eq("workspace", workspace)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
