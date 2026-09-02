import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    const { data: docs, error } = await supabaseAdmin
      .from("documents")
      .select("id, type, status, total, currency, created_at, content")
      .eq("org_id", orgId);

    if (error) throw error;

    const list = docs || [];

    // --- Summary cards ---
    const totalDocs = list.length;
    const sentCount = list.filter((d) => d.status === "sent").length;
    const paidDocs = list.filter((d) => d.status === "paid");
    const paidCount = paidDocs.length;
    const revenue = paidDocs.reduce((sum, d) => sum + (d.total || 0), 0);
    const conversionRate = totalDocs > 0 ? Math.round((paidCount / totalDocs) * 100) : 0;

    // --- Pipeline: value of sent-but-unpaid documents ---
    const pipeline = list
      .filter((d) => d.status === "sent")
      .reduce((sum, d) => sum + (d.total || 0), 0);

    // --- Average invoice value ---
    const avgValue = totalDocs > 0 ? revenue / totalDocs : 0;

    // --- Revenue by month (last 6 months) from paid docs ---
    const monthMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = 0;
    }
    // seed previous months too so chart fills
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!(key in monthMap)) monthMap[key] = 0;
    }

    paidDocs.forEach((d) => {
      const key = (d.created_at || "").slice(0, 7);
      if (key in monthMap) monthMap[key] += d.total || 0;
    });

    const revenueByMonth = Object.entries(monthMap).map(([month, value]) => ({
      month,
      value: Math.round(value * 100) / 100,
    }));

    // --- Status split ---
    const statusCounts = {
      draft: list.filter((d) => d.status === "draft").length,
      sent: sentCount,
      paid: paidCount,
      archived: list.filter((d) => d.status === "archived").length,
    };

    // --- Type split ---
    const typeCounts = {
      proposal: list.filter((d) => d.type === "proposal").length,
      invoice: list.filter((d) => d.type === "invoice").length,
      act: list.filter((d) => d.type === "act").length,
    };

    // --- Top clients by value ---
    const clientMap = new Map<string, number>();
    list.forEach((d) => {
      const name = d.content?.header?.client_name || "Unknown";
      clientMap.set(name, (clientMap.get(name) || 0) + (d.total || 0));
    });
    const topClients = Array.from(clientMap.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // --- Recent documents ---
    const recent = [...list]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5)
.map((d) => ({
        id: d.id,
        title: d.content?.header?.client_name
          ? `${d.content.header.client_name} — ${d.type}`
          : d.type,
        type: d.type,
        status: d.status,
        total: d.total,
        date: d.created_at,
      }));

    return NextResponse.json({
      summary: {
        totalDocs,
        sentCount,
        paidCount,
        revenue: Math.round(revenue * 100) / 100,
        conversionRate,
        pipeline: Math.round(pipeline * 100) / 100,
        avgValue: Math.round(avgValue * 100) / 100,
      },
      revenueByMonth,
      statusCounts,
      typeCounts,
      topClients,
      recent,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to compute analytics" }, { status: 500 });
  }
}