import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/server";

export const DEMO_ORG_ID = "ecb399e5-bf2f-487a-b2e0-f3104cfd2b30";
export const DEMO_USER_ID = "9fca18f6-9db8-4ad9-957e-9ec5821e163d";

export async function getActiveOrgId(): Promise<string> {
  const cookieStore = await cookies();

  // 1) Prefer the explicit org cookie if it looks like a real org (not a stale demo cookie)
  const cookieOrg = cookieStore.get("invoicecraft_org")?.value;
  if (cookieOrg && cookieOrg !== DEMO_USER_ID && cookieOrg !== DEMO_ORG_ID) {
    return cookieOrg;
  }

  // 2) A signed-in user always operates inside their own organization
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
  } catch (e) {
    console.error("getActiveOrgId session lookup failed:", e);
  }

  return DEMO_ORG_ID;
}

export async function getDemoDataOrgId(): Promise<string> {
  return getActiveOrgId();
}