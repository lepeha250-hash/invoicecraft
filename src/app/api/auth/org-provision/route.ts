import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("organizations")
      .select("id, name, email")
      .eq("user_id", userId)
      .maybeSingle();

    let orgId: string | undefined = existing?.id;

    if (!orgId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, name")
        .eq("id", userId)
        .maybeSingle();
      const name = profile?.name || (profile?.email ? profile.email.split("@")[0] : "My Company");
      const { data: created } = await supabaseAdmin
        .from("organizations")
        .insert({ user_id: userId, name, settings: {} })
        .select("id")
        .single();
      orgId = created?.id;
    }

    const response = NextResponse.json({ orgId });
    if (orgId) {
      response.cookies.set("invoicecraft_org", orgId, { path: "/", sameSite: "lax" });
    }
    return response;
  } catch (error) {
    console.error("org provision error:", error);
    return NextResponse.json({ error: "Failed to provision org" }, { status: 500 });
  }
}
