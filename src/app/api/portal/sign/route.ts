import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { token, signature } = await request.json();

    if (!token || !signature) {
      return NextResponse.json({ error: "token and signature required" }, { status: 400 });
    }

    const { data: share, error } = await supabaseAdmin
      .from("document_shares")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
        signature_data: { image: signature },
        updated_at: new Date().toISOString(),
      })
      .eq("token", token)
      .select()
      .single();

    if (error || !share) {
      return NextResponse.json({ error: "Share not found or expired" }, { status: 404 });
    }

    return NextResponse.json(share);
  } catch (error) {
    console.error("Sign error:", error);
    return NextResponse.json({ error: "Failed to sign" }, { status: 500 });
  }
}