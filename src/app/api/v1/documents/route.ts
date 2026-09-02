import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { extractBearerToken, resolveApiKey } from "@/lib/api-keys";
import { computeTotals, generateDocumentNumber, type BillingSettings } from "@/lib/billing";
import { fireWebhooks } from "@/lib/webhooks";
import type { DocumentContent, DocumentType } from "@/types";

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized", message: "Provide a valid API key via the Authorization: Bearer <key> header." },
    { status: 401 }
  );
}

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));
  const orgId = token ? await resolveApiKey(token) : null;
  if (!orgId) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100);

    let query = supabaseAdmin.from("documents").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data, total: (data || []).length });
  } catch (error) {
    console.error("API v1 docs fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));
  const orgId = token ? await resolveApiKey(token) : null;
  if (!orgId) return unauthorized();

  try {
    const body = await request.json();
    const { type, title, content, status } = body as {
      type: DocumentType;
      title: string;
      content: DocumentContent;
      status?: "draft" | "sent" | "paid" | "archived";
    };

    if (!type || !title) {
      return NextResponse.json(
        { error: "type and title are required" },
        { status: 400 }
      );
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();
    const settings = (org?.settings || {}) as BillingSettings;

    const rawTotal =
      content?.items?.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
        0
      ) || 0;
    const totals = computeTotals(rawTotal, settings);

    const { count } = await supabaseAdmin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
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
        org_id: orgId,
        type,
        title,
        content: savedContent,
        total: totals.total,
        status: status || "draft",
      })
      .select()
      .single();

    if (error) throw error;

    fireWebhooks(orgId, "document.created", { id: data.id, type: data.type, title: data.title, status: data.status });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("API v1 docs create error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}