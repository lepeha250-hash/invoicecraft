import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { DocumentContent } from "@/types";
import { computeTotals, type BillingSettings } from "@/lib/billing";
import { fireWebhooks } from "@/lib/webhooks";
import { auditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Document fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, status } = body as {
      title?: string;
      content?: DocumentContent;
      status?: string;
    };

    const updates: Record<string, unknown> = {
      ...(title !== undefined && { title }),
      ...(status !== undefined && { status }),
    };

    if (content) {
      const { data: doc } = await supabaseAdmin
        .from("documents")
        .select("org_id")
        .eq("id", id)
        .single();

      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("settings")
        .eq("id", doc?.org_id)
        .single();

      const settings = (org?.settings || {}) as BillingSettings;
      const rawTotal = content.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );
      const totals = computeTotals(rawTotal, settings);
      updates.content = content;
      updates.total = totals.total;
    }

    const { data, error } = await supabaseAdmin
      .from("documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const eventMap: Record<string, string> = {
      sent: "document.sent",
      paid: "document.paid",
      archived: "document.archived",
      signed: "document.signed",
    };
    fireWebhooks(
      data.org_id,
      body.status ? (eventMap[body.status] || "document.updated") : "document.updated",
      { id: data.id, type: data.type, title: data.title, status: data.status }
    );
    auditLog({
      org_id: data.org_id,
      action: body.status ? `document.${body.status}` : "document.updated",
      entity_type: "document",
      entity_id: data.id,
      details: { title: data.title, status: data.status, ...(body.status && { from: body.status }) },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Document update error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: before } = await supabaseAdmin
      .from("documents")
      .select("org_id")
      .eq("id", id)
      .single();

    const { error } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;
    if (before?.org_id) auditLog({ org_id: before.org_id, action: "document.deleted", entity_type: "document", entity_id: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
