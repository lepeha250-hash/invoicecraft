import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const DEMO_USER = "9fca18f6-9db8-4ad9-957e-9ec5821e163d";

const DEMO_ORG = "ecb399e5-bf2f-487a-b2e0-f3104cfd2b30";

async function resolveUserId(req: NextRequest): Promise<string> {
  const cookieOrg = req.cookies.get("invoicecraft_org")?.value;
  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId) return headerUserId;

  if (cookieOrg && cookieOrg !== DEMO_ORG) {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("user_id")
      .eq("id", cookieOrg)
      .maybeSingle();
    if (org?.user_id) return org.user_id;
  }

  return DEMO_USER;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return NextResponse.json({
      userId,
      subscription: data || { user_id: userId, plan: "free", status: "active" },
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json({ error: "Failed to load subscription" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();
    const userId = await resolveUserId(request);

    const allowed = ["free", "pro", "business"];
    if (!allowed.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let result;
    if (existing) {
      const upd = await supabaseAdmin
        .from("subscriptions")
        .update({ plan, status: "active", updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      result = upd.data;
    } else {
      const ins = await supabaseAdmin
        .from("subscriptions")
        .insert({ user_id: userId, plan, status: "active" })
        .select()
        .single();
      result = ins.data;
    }

    if (!result) {
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
    }
    return NextResponse.json({ subscription: result });
  } catch (error) {
    console.error("Subscription update error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
