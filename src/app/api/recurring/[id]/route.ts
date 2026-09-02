import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const cadenceDays: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  yearly: 365,
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if ("active" in body) updates.active = body.active;
    if ("title" in body) updates.title = body.title;
    if ("cadence" in body) updates.cadence = body.cadence;
    if ("total" in body) updates.total = body.total;
    if ("client_name" in body) updates.client_name = body.client_name;
    if ("client_email" in body) updates.client_email = body.client_email;
    if ("config" in body) updates.config = body.config;

    const { data, error } = await supabaseAdmin
      .from("recurring_documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Recurring update error:", error);
    return NextResponse.json({ error: "Failed to update recurring document" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("recurring_documents")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recurring delete error:", error);
    return NextResponse.json({ error: "Failed to delete recurring document" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // "run_now" action: generate an invoice document from the recurring config
    if (body.action === "run_now") {
      const { data: rec, error: recError } = await supabaseAdmin
        .from("recurring_documents")
        .select("*")
        .eq("id", id)
        .single();

      if (recError || !rec) throw recError || new Error("Recurring not found");

      const content = {
        ...(rec.config || {}),
        items: rec.config?.items || [],
        client: rec.client_name
          ? { name: rec.client_name, email: rec.client_email }
          : undefined,
      };

      const { data: doc, error: docError } = await supabaseAdmin
        .from("documents")
        .insert({
          org_id: rec.org_id,
          type: "invoice",
          title: `${rec.title} — ${new Date().toLocaleDateString()}`,
          content,
          total: rec.total,
          currency: rec.currency || "USD",
          status: "draft",
        })
        .select()
        .single();

      if (docError) throw docError;

      const nextRunAt = new Date(
        Date.now() + (cadenceDays[rec.cadence] || 30) * 24 * 60 * 60 * 1000
      ).toISOString();

      await supabaseAdmin
        .from("recurring_documents")
        .update({ last_run_at: new Date().toISOString(), next_run_at: nextRunAt })
        .eq("id", id);

      return NextResponse.json({ document: doc, next_run_at: nextRunAt });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Recurring action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
