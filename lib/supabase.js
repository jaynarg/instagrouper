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

// Simple shared-passphrase gate. If APP_PASSWORD isn't set, the app runs open.
export function authorized(req) {
  const need = process.env.APP_PASSWORD;
  if (!need) return true;
  return req.headers.get("x-stash-key") === need;
}

// Pull the shortcode out of an Instagram URL so we can dedupe pasted posts.
export function shortcodeFromUrl(url = "") {
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i);
  return m ? m[1] : null;
}
