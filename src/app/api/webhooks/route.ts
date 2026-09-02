import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fireWebhooks } from "@/lib/webhooks";
import crypto from "crypto";

export const WEBHOOK_EVENTS = [
  "document.created",
  "document.updated",
  "document.sent",
  "document.paid",
  "document.signed",
  "document.archived",
  "document.deleted",
] as const;

async function withOrg(request: NextRequest): Promise<{ orgId: string | null; error?: NextResponse }> {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");
  if (!orgId) {
    return { orgId: null, error: NextResponse.json({ error: "org_id is required" }, { status: 400 }) };
  }
  return { orgId };
}

export async function GET(request: NextRequest) {
  const { orgId, error } = await withOrg(request);
  if (error || !orgId) return error!;

  try {
    const { data, error: err } = await supabaseAdmin
      .from("webhooks")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (err) throw err;
    return NextResponse.json(data);
  } catch (err) {
    console.error("Webhooks fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { orgId, error } = await withOrg(request);
  if (error || !orgId) return error!;

  try {
    const { url, events, active } = await request.json();
    if (!url || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "url and events are required" }, { status: 400 });
    }

    const validEvents = events.filter((e) => (WEBHOOK_EVENTS as readonly string[]).includes(e));
    if (validEvents.length === 0) {
      return NextResponse.json({ error: "No valid events provided" }, { status: 400 });
    }

    const secret = crypto.randomBytes(16).toString("hex");

    const { data, error: err } = await supabaseAdmin
      .from("webhooks")
      .insert({
        org_id: orgId,
        url: String(url).slice(0, 1000),
        events: validEvents,
        secret,
        active: active !== false,
      })
      .select("*")
      .single();

    if (err) throw err;

    // Fire a test event immediately so deliveries log shows a first ping
    fireWebhooks(orgId, "document.created", {
      test: true,
      message: "Welcome to InvoiceCraft webhooks - your endpoint is verified.",
    });

    return NextResponse.json({ ...data, secret, warning: "Store this secret - it signs webhook payloads." });
  } catch (err) {
    console.error("Webhook create error:", err);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}