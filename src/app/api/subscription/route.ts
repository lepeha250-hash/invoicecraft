import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/server";

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const cookieOrg = request.cookies.get("invoicecraft_org")?.value;
  if (cookieOrg) {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("user_id")
      .eq("id", cookieOrg)
      .maybeSingle();
    if (org?.user_id) return org.user_id;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return unauthorized();

    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const subscription = data || { user_id: userId, plan: "free", status: "active", billing_interval: "month" };

    // Real usage counters for the billing page
    const docLimit = subscription.plan === "free" ? 3 : -1;
    let used = 0;
    const orgCookie = request.cookies.get("invoicecraft_org")?.value;
    if (orgCookie) {
      const { count } = await supabaseAdmin
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgCookie);
      used = count || 0;
    }

    return NextResponse.json({ userId, subscription, documents: { used, limit: docLimit } });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json({ error: "Failed to load subscription" }, { status: 500 });
  }
}

const INTERVALS: Record<string, "month" | "quarter" | "semiannual" | "year"> = {
  month: "month",
  quarter: "quarter",
  semiannual: "semiannual",
  year: "year",
};

const INTERVAL_MONTHS: Record<string, number> = {
  month: 1,
  quarter: 3,
  semiannual: 6,
  year: 12,
};

export async function POST(request: NextRequest) {
  try {
    const { plan, interval } = await request.json();
    const userId = await resolveUserId(request);
    if (!userId) return unauthorized();

    const allowed = ["free", "pro", "business"];
    if (!allowed.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2 };

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id, plan")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const currentRank = PLAN_RANK[existing.plan] ?? 0;
      const targetRank = PLAN_RANK[plan] ?? 0;
      if (targetRank < currentRank) {
        return NextResponse.json({ error: "Only upgrades to a higher plan are allowed" }, { status: 403 });
      }
    }

    const billingInterval = (INTERVALS[interval as string] ?? "month") as "month" | "quarter" | "semiannual" | "year";

    let periodEnd: string | null = null;
    if (plan !== "free") {
      const now = new Date();
      now.setMonth(now.getMonth() + INTERVAL_MONTHS[billingInterval]);
      periodEnd = now.toISOString();
    }

    let result;
    if (existing) {
      const upd = await supabaseAdmin
        .from("subscriptions")
        .update({
          plan,
          billing_interval: billingInterval,
          current_period_end: periodEnd,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      result = upd.data;
    } else {
      const ins = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan,
          billing_interval: billingInterval,
          current_period_end: periodEnd,
          status: "active",
        })
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
