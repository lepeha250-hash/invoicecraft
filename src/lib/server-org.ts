import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/server";

export const ORG_COOKIE = "invoicecraft_org";

/**
 * Resolve the active organization for the signed-in user.
 * The middleware guarantees authentication and keeps the org cookie in sync,
 * so this is cheap: read the cookie, fall back to the session user's org.
 * Returns null when unauthenticated or no org can be derived.
 */
export async function getActiveOrgId(): Promise<string | null> {
  const cookieStore = await cookies();

  const cookieOrg = cookieStore.get(ORG_COOKIE)?.value;
  if (cookieOrg) return cookieOrg;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (org?.id) return org.id;
    }
  } catch (error) {
    console.error("getActiveOrgId session lookup failed:", error);
  }

  return null;
}