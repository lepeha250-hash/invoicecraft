import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import crypto from "crypto";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { data: wh, error } = await supabaseAdmin
      .from("webhooks")
      .select("id, url, secret, events")
      .eq("id", id)
      .single();
    if (error || !wh) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const body = {
      id: crypto.randomUUID(),
      event: "test.ping",
      created_at: new Date().toISOString(),
      data: { message: "Test ping from InvoiceCraft" },
    };

    let status: "delivered" | "failed" = "failed";
    let responseStatus: number | null = null;
    let errorDetail: string | null = null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (wh.secret) {
        const signature = crypto
          .createHmac("sha256", wh.secret)
          .update(JSON.stringify(body))
          .digest("hex");
        headers["X-InvoiceCraft-Signature"] = `sha256=${signature}`;
      }
      const res = await fetch(wh.url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      responseStatus = res.status;
      status = res.ok ? "delivered" : "failed";
      if (!res.ok) errorDetail = `HTTP ${res.status}`;
    } catch (e) {
      errorDetail = e instanceof Error ? e.message : "Network error";
      status = "failed";
    }

    await supabaseAdmin.from("webhook_deliveries").insert({
      webhook_id: id,
      event: "test.ping",
      payload: body as unknown as Record<string, unknown>,
      status,
      response_status: responseStatus,
    });

    return NextResponse.json({ ok: true, status, response_status: responseStatus, error: errorDetail });
  } catch (error) {
    console.error("Webhook test error:", error);
    return NextResponse.json({ error: "Failed to test webhook" }, { status: 500 });
  }
}