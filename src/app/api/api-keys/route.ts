import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api-keys";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, key_prefix, created_at, last_used_at, revoked")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("API keys fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { org_id, name } = await request.json();
    if (!org_id || !name) {
      return NextResponse.json({ error: "org_id and name are required" }, { status: 400 });
    }

    const key = generateApiKey();

    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        org_id,
        name: String(name).slice(0, 120),
        api_key: key,
        key_prefix: key.slice(0, 8),
        revoked: false,
      })
      .select("id, name, key_prefix, created_at, revoked")
      .single();

    if (error) throw error;

    auditLog({ org_id, action: "api_key.created", entity_type: "api_key", entity_id: data.id, details: { name: data.name } });

    // Return the full key exactly once
    return NextResponse.json({ ...data, api_key: key, warning: "Store this key now - it will not be shown again." });
  } catch (error) {
    console.error("API key create error:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}