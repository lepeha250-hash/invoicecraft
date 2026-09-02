import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { documentId, email, expiresInDays = 14 } = await request.json();

    if (!documentId || !email) {
      return NextResponse.json({ error: "documentId and email required" }, { status: 400 });
    }

    const { data: doc, error } = await supabaseAdmin
      .from("documents")
      .select("id, type, title, content, total")
      .eq("id", documentId)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { error: insertError } = await supabaseAdmin
      .from("document_shares")
      .insert({
        document_id: documentId,
        token,
        email,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      });

    if (insertError) throw insertError;

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/d/${token}`;

    return NextResponse.json({
      token,
      portalUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Create share error:", error);
    return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("document_shares")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("List shares error:", error);
    return NextResponse.json({ error: "Failed to list shares" }, { status: 500 });
  }
}