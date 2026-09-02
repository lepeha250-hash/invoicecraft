import { supabaseAdmin } from "@/lib/supabase/server";
import crypto from "crypto";

export const API_KEY_PREFIX = "ic_";

export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${crypto.randomBytes(24).toString("hex")}`;
}

/**
 * Resolve a Bearer API key to an org. Returns org_id or null for invalid keys.
 */
export async function resolveApiKey(key: string): Promise<string | null> {
  if (!key || !key.startsWith(API_KEY_PREFIX)) return null;

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("org_id, id")
    .eq("api_key", key)
    .eq("revoked", false)
    .maybeSingle();

  if (error || !data) return null;

  // Track last usage (best effort)
  await supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data.org_id;
}

export function extractBearerToken(header: string | null): string | null {
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}