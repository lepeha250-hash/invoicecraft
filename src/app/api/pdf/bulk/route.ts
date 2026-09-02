import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { renderDocumentPDF } from "@/lib/pdf-document";
import { auditLog } from "@/lib/audit";
import type { BillingSettings } from "@/lib/billing";
import archiver from "archiver";

export async function POST(request: NextRequest) {
  try {
    const { org_id, ids } = await request.json();
    if (!org_id || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "org_id and ids are required" }, { status: 400 });
    }
    if (ids.length > 100) {
      return NextResponse.json({ error: "Max 100 documents per export" }, { status: 400 });
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name, settings")
      .eq("id", org_id)
      .single();
    const settings: BillingSettings = {
      ...(org?.settings || {}),
      brand: {
        ...((org?.settings as BillingSettings)?.brand || {}),
        name: org?.name,
      },
    };

    const { data: docs, error } = await supabaseAdmin
      .from("documents")
      .select("id, title, type, content")
      .eq("org_id", org_id)
      .in("id", ids);

    if (error) throw error;
    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: "No documents found" }, { status: 404 });
    }

    // Render all PDFs first
    const pdfFiles: { name: string; bytes: Buffer }[] = [];
    for (const doc of docs) {
      let pdfBytes: Buffer;
      try {
        pdfBytes = Buffer.from(await renderDocumentPDF(doc.content, settings));
      } catch (e) {
        console.error(`PDF render failed for ${doc.id}:`, e);
        pdfBytes = Buffer.from(`Document ${doc.id} could not be rendered.`);
      }
      const safeTitle = (doc.title || doc.id).replace(/[^\w\d\- ]+/g, "_").slice(0, 80);
      const n = doc.content?.header?.number || doc.id.slice(0, 8);
      pdfFiles.push({ name: `${safeTitle}_${n}.pdf`, bytes: pdfBytes });
    }

    // Build ZIP in memory (documents are small)
    const zip = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    const buildError = new Promise<Error | null>((resolve) => {
      zip.on("error", (err) => resolve(err));
      zip.on("end", () => resolve(null));
    });
    zip.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));

    for (const f of pdfFiles) {
      zip.append(f.bytes, { name: f.name });
    }
    await zip.finalize();
    const err = await buildError;
    if (err) throw err;

    const archiveBuffer = Buffer.concat(chunks);

    auditLog({ org_id, action: "documents.exported", entity_type: "document", details: { count: docs.length, format: "pdf-zip" } });

    const timestamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(archiveBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="invoicecraft_documents_${timestamp}.zip"`,
      },
    });
  } catch (error) {
    console.error("Bulk PDF error:", error);
    return NextResponse.json({ error: "Failed to export documents" }, { status: 500 });
  }
}
