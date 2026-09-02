import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { extractBearerToken, resolveApiKey } from "@/lib/api-keys";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));
  const orgId = token ? await resolveApiKey(token) : null;
  if (!orgId) return unauthorized();

  try {
    const { data: docs, error } = await supabaseAdmin
      .from("documents")
      .select("type, status, total")
      .eq("org_id", orgId);

    if (error) throw error;
    const list = docs || [];

    const byStatus = list.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = list.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const revenue = list
      .filter((d) => d.status === "paid")
      .reduce((sum, d) => sum + Number(d.total || 0), 0);

    const pipeline = list
      .filter((d) => d.status === "sent")
      .reduce((sum, d) => sum + Number(d.total || 0), 0);

    return NextResponse.json({
      data: {
        total_documents: list.length,
        revenue,
        open_pipeline: pipeline,
        by_status: byStatus,
        by_type: byType,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("API v1 stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}