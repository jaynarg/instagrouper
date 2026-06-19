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

  // Page through in chunks of PAGE. We order by saved_date AND id: the unique id
  // is a tiebreaker that gives a total, deterministic order, so pages don't
  // overlap when many rows share the same saved_date (which would otherwise
  // produce duplicate rows — and duplicate React keys break the grid).
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("workspace", workspace)
      .order("saved_date", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    all = all.concat(data);
    if (data.length < PAGE) break; // last (partial) page reached
    from += data.length;
  }

  // Belt-and-suspenders: guarantee unique ids even if a page edge ever overlaps.
  const seen = new Set();
  const posts = all.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)));

  return NextResponse.json({ workspace, handle: handleForWorkspace(workspace), posts });
}
