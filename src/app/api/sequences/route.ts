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
      .from("email_sequences")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sequences fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch sequences" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_id, name, trigger_type, document_type, steps, active } = body;

    if (!org_id || !name || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "org_id, name and steps are required" },
        { status: 400 }
      );
    }

    const sanitizedSteps = steps
      .filter((s: { delay_days?: number; subject?: string; body?: string }) =>
        typeof s?.delay_days === "number" && s?.subject && s?.body
      )
      .map((s: { delay_days?: number; subject?: string; body?: string }) => ({
        delay_days: Math.max(0, Math.floor(s.delay_days || 0)),
        subject: String(s.subject).slice(0, 300),
        body: String(s.body).slice(0, 5000),
      }));

    if (sanitizedSteps.length === 0) {
      return NextResponse.json({ error: "At least one complete step is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("email_sequences")
      .insert({
        org_id,
        name: String(name).slice(0, 200),
        trigger_type: trigger_type || "document_sent",
        document_type: document_type || null,
        steps: sanitizedSteps,
        active: active !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sequence create error:", error);
    return NextResponse.json({ error: "Failed to create sequence" }, { status: 500 });
  }
}