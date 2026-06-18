import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service_role key, so it bypasses RLS — this is
// why all database access goes through the API routes and never the browser.
// These env vars have no NEXT_PUBLIC_ prefix, so they're never sent to the client.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

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
