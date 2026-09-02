import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { auditLog } from "@/lib/audit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { data: before } = await supabaseAdmin.from("api_keys").select("org_id").eq("id", id).maybeSingle();
    const { error } = await supabaseAdmin.from("api_keys").delete().eq("id", id);
    if (error) throw error;
    if (before?.org_id) auditLog({ org_id: before.org_id, action: "api_key.deleted", entity_type: "api_key", entity_id: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("API key delete error:", error);
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .update({ revoked: Boolean(body.revoked) })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (data?.org_id) auditLog({ org_id: data.org_id, action: body.revoked ? "api_key.revoked" : "api_key.unrevoked", entity_type: "api_key", entity_id: id });
    return NextResponse.json(data);
  } catch (error) {
    console.error("API key revoke error:", error);
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}