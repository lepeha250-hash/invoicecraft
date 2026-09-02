import { NextRequest, NextResponse } from "next/server";
import { renderDocumentPDF } from "@/lib/pdf-document";

export async function POST(request: NextRequest) {
  const { content, settings } = await request.json();

  const buffer = await renderDocumentPDF(content, settings || {});
  const filename = `document-${Date.now()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}