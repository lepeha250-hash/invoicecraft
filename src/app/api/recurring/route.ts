import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("recurring_documents")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Recurring fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch recurring documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      org_id,
      title,
      cadence,
      total,
      currency,
      client_name,
      client_email,
      config,
    } = body;

    if (!org_id || !title || !cadence || !total) {
      return NextResponse.json(
        { error: "org_id, title, cadence and total are required" },
        { status: 400 }
      );
    }

    const cadenceMap: Record<string, { days: number }> = {
      weekly: { days: 7 },
      monthly: { days: 30 },
      quarterly: { days: 91 },
      yearly: { days: 365 },
    };

    const days = cadenceMap[cadence]?.days;
    if (!days) {
      return NextResponse.json({ error: "Invalid cadence" }, { status: 400 });
    }

    const nextRunAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("recurring_documents")
      .insert({
        org_id,
        title,
        cadence,
        total,
        currency: currency || "USD",
        client_name,
        client_email,
        config: config || {},
        next_run_at: nextRunAt,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Recurring create error:", error);
    return NextResponse.json({ error: "Failed to create recurring document" }, { status: 500 });
  }
}
