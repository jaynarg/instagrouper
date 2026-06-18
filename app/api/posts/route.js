import { NextResponse } from "next/server";
import { getSupabase, authorized } from "../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("saved_date", { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
