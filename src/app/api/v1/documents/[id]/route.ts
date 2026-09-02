import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { extractBearerToken, resolveApiKey } from "@/lib/api-keys";
import { fireWebhooks } from "@/lib/webhooks";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const token = extractBearerToken(_request.headers.get("authorization"));
  const orgId = token ? await resolveApiKey(token) : null;
  if (!orgId) return unauthorized();

  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("API v1 doc fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const token = extractBearerToken(request.headers.get("authorization"));
  const orgId = token ? await resolveApiKey(token) : null;
  if (!orgId) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();

    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") patch.title = body.title;
    if (body.content && typeof body.content === "object") patch.content = body.content;
    if (body.status && typeof body.status === "string") {
      patch.status = body.status;
    }

    const { data: before } = await supabaseAdmin
      .from("documents")
      .select("status")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    const { data, error } = await supabaseAdmin
      .from("documents")
      .update(patch)
      .eq("id", id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Document not found or not updated" }, { status: 404 });
    }

    if (body.status && before?.status !== data.status) {
      const eventMap: Record<string, string> = {
        sent: "document.sent",
        paid: "document.paid",
        archived: "document.archived",
        signed: "document.signed",
      };
      const event = eventMap[data.status as string] || "document.updated";
      fireWebhooks(orgId, event, { id: data.id, type: data.type, title: data.title, status: data.status });
    } else {
      fireWebhooks(orgId, "document.updated", { id: data.id, type: data.type, title: data.title, status: data.status });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("API v1 doc update error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const token = extractBearerToken(request.headers.get("authorization"));
  const orgId = token ? await resolveApiKey(token) : null;
  if (!orgId) return unauthorized();

  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);
    if (error) throw error;
    fireWebhooks(orgId, "document.deleted", { id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("API v1 doc delete error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}