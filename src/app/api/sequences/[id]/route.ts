import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const patch: Record<string, unknown> = {};
    if (typeof body.name === "string") patch.name = body.name.slice(0, 200);
    if (typeof body.trigger_type === "string") patch.trigger_type = body.trigger_type;
    if (typeof body.document_type === "string" || body.document_type === null)
      patch.document_type = body.document_type;
    if (Array.isArray(body.steps)) {
      patch.steps = body.steps
        .filter((s: { delay_days?: number; subject?: string; body?: string }) =>
          typeof s?.delay_days === "number" && s?.subject && s?.body
        )
        .map((s: { delay_days?: number; subject?: string; body?: string }) => ({
          delay_days: Math.max(0, Math.floor(s.delay_days || 0)),
          subject: String(s.subject).slice(0, 300),
          body: String(s.body).slice(0, 5000),
        }));
    }
    if (typeof body.active === "boolean") patch.active = body.active;
    patch.updated_at = new Date().toISOString();

    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("email_sequences")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sequence update error:", error);
    return NextResponse.json({ error: "Failed to update sequence" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("email_sequences")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sequence delete error:", error);
    return NextResponse.json({ error: "Failed to delete sequence" }, { status: 500 });
  }
}