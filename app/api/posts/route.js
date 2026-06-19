import { NextResponse } from "next/server";
import { getSupabase, resolveWorkspace, handleForWorkspace } from "../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = 1000; // Supabase returns at most ~1000 rows per request; page through.

export async function GET(req) {
  const workspace = resolveWorkspace(req);
  if (!workspace) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Page through in chunks of PAGE so workspaces with more than 1000 posts
  // (hi, mom) come back complete instead of capped at the first 1000.
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("workspace", workspace)
      .order("saved_date", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    all = all.concat(data);
    if (data.length < PAGE) break; // last (partial) page reached
    from += data.length;
  }

  return NextResponse.json({ workspace, handle: handleForWorkspace(workspace), posts: all });
}
