import { supabaseAdmin } from "@/lib/supabase/server";

interface AuditEntry {
  org_id: string;
  actor?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

/**
 * Write an audit log entry (best-effort, never throws).
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await supabaseAdmin.from("audit_log").insert({
      org_id: entry.org_id,
      actor: entry.actor || "system",
      action: entry.action,
      entity_type: entry.entity_type || null,
      entity_id: entry.entity_id || null,
      details: entry.details || {},
    });
  } catch (error) {
    console.error("auditLog error:", error);
  }
}

/** Extract a human-readable actor from a request (email, key prefix, or "system"). */
export function extractActor(
  headers: Headers,
  body?: { email?: string; name?: string }
): string {
  const auth = headers.get("authorization");
  if (auth) {
    if (auth.startsWith("Bearer ic_")) return "api_key";
    if (body?.email) return body.email;
  }
  return "system";
}