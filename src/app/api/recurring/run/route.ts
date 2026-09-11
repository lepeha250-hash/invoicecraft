import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const cadenceDays: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  yearly: 365,
};

// Processes recurring documents that are due (next_run_at <= now)
export async function POST() {
  try {
    const now = new Date().toISOString();

    const { data: dueItems, error } = await supabaseAdmin
      .from("recurring_documents")
      .select("*")
      .eq("active", true)
      .lte("next_run_at", now);

    if (error) throw error;

    if (!dueItems || dueItems.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    const results = [];

    for (const rec of dueItems) {
      const content = {
        ...(rec.config || {}),
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

      if (docError) {
        console.error("Auto-generate error for", rec.id, docError);
        continue;
      }

      const nextRunAt = new Date(
        Date.now() + (cadenceDays[rec.cadence] || 30) * 24 * 60 * 60 * 1000
      ).toISOString();

      await supabaseAdmin
        .from("recurring_documents")
        .update({ last_run_at: new Date().toISOString(), next_run_at: nextRunAt })
        .eq("id", rec.id);

      results.push(doc.id);
    }

    return NextResponse.json({ processed: results.length, documents: results });
  } catch (error) {
    console.error("Recurring cron error:", error);
    return NextResponse.json({ error: "Recurring cron failed" }, { status: 500 });
  }
}