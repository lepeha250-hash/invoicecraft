import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

interface SequenceStep {
  delay_days: number;
  subject: string;
  body: string;
}

export async function POST(_request: NextRequest) {
  try {
    // 1. Active sequences
    const { data: sequences, error: seqError } = await supabaseAdmin
      .from("email_sequences")
      .select("*")
      .eq("active", true);

    if (seqError) throw seqError;
    if (!sequences || sequences.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0 });
    }

    let sent = 0;
    let processed = 0;

    for (const seq of sequences) {
      const steps = (seq.steps || []) as SequenceStep[];
      if (steps.length === 0) continue;

      // 2. Candidate documents for this sequence
      let query = supabaseAdmin
        .from("documents")
        .select("id, title, status, total, currency, created_at, updated_at, content")
        .eq("org_id", seq.org_id);

      if (seq.document_type) {
        query = query.eq("type", seq.document_type);
      }

      if (seq.trigger_type === "document_sent") {
        query = query.in("status", ["sent"]);
      } else if (seq.trigger_type === "invoice_unpaid") {
        // Invoices still in "sent" (not yet paid)
        query = query.eq("type", "invoice").eq("status", "sent");
      }

      const { data: documents, error: docError } = await query;
      if (docError) throw docError;
      if (!documents || documents.length === 0) continue;

      // 3. Existing logs for these docs + sequence
      const docIds = documents.map((d) => d.id);
      const { data: logs, error: logError } = await supabaseAdmin
        .from("email_sequence_logs")
        .select("*")
        .eq("sequence_id", seq.id)
        .in("document_id", docIds);
      if (logError) throw logError;

      const logMap = new Map(
        (logs || []).map((l) => [`${l.document_id}:${l.step_index}`, l])
      );

      const now = Date.now();

      for (const doc of documents) {
        const sentAt = new Date(doc.updated_at || doc.created_at).getTime();
        if (isNaN(sentAt)) continue;
        const daysElapsed = (now - sentAt) / (24 * 60 * 60 * 1000);

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (daysElapsed < step.delay_days) continue; // not due yet

          const key = `${doc.id}:${i}`;
          if (logMap.has(key)) continue; // already scheduled/sent

          const toEmail = doc.content?.header?.client_email || null;
          const subject = step.subject
            .replace(/%CLIENT%/, doc.content?.header?.client_name || "Client")
            .replace(/%NUMBER%/, doc.content?.header?.number || "")
            .replace(/%TITLE%/, doc.title || "");

          const { error: insertError } = await supabaseAdmin
            .from("email_sequence_logs")
            .insert({
              sequence_id: seq.id,
              document_id: doc.id,
              step_index: i,
              status: "sent",
              scheduled_at: new Date().toISOString(),
              sent_at: new Date().toISOString(),
              to_email: toEmail,
              subject,
            });
          if (insertError) throw insertError;

          logMap.set(key, {});
          sent++;
          processed++;
        }
      }
    }

    return NextResponse.json({ processed, sent });
  } catch (error) {
    console.error("Sequence run error:", error);
    return NextResponse.json({ error: "Failed to process sequences" }, { status: 500 });
  }
}