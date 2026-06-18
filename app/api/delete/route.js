import { NextResponse } from "next/server";
import { getSupabase, authorized } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function POST(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  // Removes the row from this database only. It does not touch the Instagram
  // account or the original saved bookmark.
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
