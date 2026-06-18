import { createClient } from "@supabase/supabase-js";

// Construct the client lazily (on first request), NOT at module load. Building
// it at the top level would run during Vercel's build step, before env vars are
// in scope, and throw "Invalid supabaseUrl". These vars have no NEXT_PUBLIC_
// prefix, so they stay server-side and never reach the browser.
let _client = null;
export function getSupabase() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return _client;
}

// Resolve the caller's passphrase (sent as the x-stash-key header) to a
// workspace name, using the WORKSPACES env var — a JSON map of
// passphrase -> workspace, e.g. {"moms-phrase":"mom","jays-phrase":"jay"}.
// Returns the workspace string, or null if the passphrase isn't recognized.
// Every API route calls this and scopes its queries to the returned workspace,
// so each passphrase only ever sees and touches its own rows.
export function resolveWorkspace(req) {
  const key = (req.headers.get("x-stash-key") || "").trim();
  if (!key) return null;
  let map;
  try {
    map = JSON.parse(process.env.WORKSPACES || "{}");
  } catch {
    return null; // misconfigured WORKSPACES — deny rather than leak
  }
  const ws = map[key];
  return ws ? String(ws) : null;
}

// Optional display handle per workspace, from the HANDLES env var — a JSON map
// of workspace -> instagram handle, e.g. {"jay":"jayguevara25","mom":"..."}.
// Used only for the "Account: @handle" label; returns null if unset.
export function handleForWorkspace(workspace) {
  if (!workspace) return null;
  let map;
  try {
    map = JSON.parse(process.env.HANDLES || "{}");
  } catch {
    return null;
  }
  const h = map[workspace];
  return h ? String(h).replace(/^@/, "") : null;
}

// Pull the shortcode out of an Instagram URL so we can dedupe pasted posts.
export function shortcodeFromUrl(url = "") {
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i);
  return m ? m[1] : null;
}
