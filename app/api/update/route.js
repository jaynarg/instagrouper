import { NextResponse } from "next/server";
import { getSupabase, resolveWorkspace } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function POST(req) {
  const workspace = resolveWorkspace(req);
  if (!workspace) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { id, summary, tags } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const patch = { edited: true };
  if (typeof summary === "string") patch.summary = summary;
  if (Array.isArray(tags)) patch.tags = tags.map((t) => String(t).toLowerCase());

  const { data, error } = await supabase
    .from("posts")
    .update(patch)
    .eq("id", id)
    .eq("workspace", workspace)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
