import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { DocumentContent, DocumentType } from "@/types";
import { computeTotals, generateDocumentNumber, type BillingSettings } from "@/lib/billing";
import { fireWebhooks } from "@/lib/webhooks";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Documents fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_id, type, title, content } = body as {
      org_id: string;
      type: DocumentType;
      title: string;
      content: DocumentContent;
    };

    if (!org_id || !type || !title) {
      return NextResponse.json(
        { error: "org_id, type and title are required" },
        { status: 400 }
      );
    }

    // Load org settings for numbering and tax
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("settings")
      .eq("id", org_id)
      .single();

    const settings = (org?.settings || {}) as BillingSettings;

    const rawTotal =
      content?.items?.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
        0
      ) || 0;

    const totals = computeTotals(rawTotal, settings);

    // Count existing docs of this type to compute the next sequence number
    const { count } = await supabaseAdmin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org_id)
      .eq("type", type);

    const nextNumber = generateDocumentNumber(type, count || 0, settings);

    const savedContent = {
      ...content,
      header: {
        ...content?.header,
        number: content?.header?.number || nextNumber,
      },
    };

    const { data, error } = await supabaseAdmin
      .from("documents")
      .insert({
        org_id,
        type,
        title,
        content: savedContent,
        total: totals.total,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    fireWebhooks(org_id, "document.created", { id: data.id, type: data.type, title: data.title, status: data.status });
    auditLog({ org_id, action: "document.created", entity_type: "document", entity_id: data.id, details: { type: data.type, title: data.title } });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Document create error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
