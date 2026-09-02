import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";

export const DEMO_ORG_ID = "ecb399e5-bf2f-487a-b2e0-f3104cfd2b30";
export const DEMO_USER_ID = "9fca18f6-9db8-4ad9-957e-9ec5821e163d";

export async function getActiveOrgId(): Promise<string> {
  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get("invoicecraft_org")?.value;
  if (cookieOrg && cookieOrg !== DEMO_USER_ID) {
    return cookieOrg;
  }
  return DEMO_ORG_ID;
}

export async function getDemoDataOrgId(): Promise<string> {
  return getActiveOrgId();
}
