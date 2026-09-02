import { supabaseAdmin } from "@/lib/supabase/server";
import crypto from "crypto";

export interface WebhookEvent {
  event: string;
  payload: Record<string, unknown>;
}

const WEBHOOK_TIMEOUT_MS = 4000;

/**
 * Fire a webhook event to all active webhooks subscribed to it.
 * Delivery is fire-and-forget: outcomes are written to webhook_deliveries.
 */
export async function fireWebhooks(
  orgId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const { data: webhooks, error } = await supabaseAdmin
      .from("webhooks")
      .select("*")
      .eq("org_id", orgId)
      .eq("active", true);

    if (error) throw error;
    if (!webhooks || webhooks.length === 0) return;

    const subscriptions = webhooks.filter((w) =>
      (w.events || []).includes(event)
    );

    for (const wh of subscriptions) {
      deliver(wh, event, payload).catch((e) => {
        console.error(`Webhook delivery error (${wh.id}):`, e);
      });
    }
  } catch (error) {
    console.error("fireWebhooks error:", error);
  }
}

interface WebhookRow {
  id: string;
  url: string;
  secret?: string | null;
}

async function deliver(
  wh: WebhookRow,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const body = {
    id: crypto.randomUUID(),
    event,
    created_at: new Date().toISOString(),
    data: payload,
  };

  // Historical safety: capture delivery attempt even if fetch fails internally
  let status: "delivered" | "failed" = "failed";
  let responseStatus: number | null = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "InvoiceCraft-Webhooks/1.0",
    };
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
  } catch (error) {
    console.error("Webhook fetch error:", error);
    status = "failed";
  }

  await supabaseAdmin.from("webhook_deliveries").insert({
    webhook_id: wh.id,
    event,
    payload: body as unknown as Record<string, unknown>,
    status,
    response_status: responseStatus,
  });
}