import { NextResponse } from "next/server";
import { getSupabase, resolveWorkspace } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function POST(req) {
  const workspace = resolveWorkspace(req);
  if (!workspace) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  // Removes the row from this workspace only. It does not touch Instagram.
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("workspace", workspace);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
