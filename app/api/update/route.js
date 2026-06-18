import { NextResponse } from "next/server";
import { getSupabase, authorized } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function POST(req) {
  if (!authorized(req)) {
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
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
