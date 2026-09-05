import { Metadata } from "next";
import { notFound } from "next/navigation";
import AnalyticsClient from "./analytics-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/server-org";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "Analytics — InvoiceCraft", ru: "Аналитика — InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

// Force dynamic - fresh metrics each load
export const dynamic = "force-dynamic";

interface AnalyticsDocRow {
  id: string;
  type: string;
  status: string;
  total: number | null;
  created_at: string | null;
  content?: { header?: { client_name?: string } } | null;
}

function computeAnalytics(docs: AnalyticsDocRow[]) {
  const totalDocs = docs.length;
  const sentCount = docs.filter((d) => d.status === "sent").length;
  const paidDocs = docs.filter((d) => d.status === "paid");
  const paidCount = paidDocs.length;
  const revenue = paidDocs.reduce((sum, d) => sum + (d.total || 0), 0);
  const conversionRate = totalDocs > 0 ? Math.round((paidCount / totalDocs) * 100) : 0;
  const pipeline = docs
    .filter((d) => d.status === "sent")
    .reduce((sum, d) => sum + (d.total || 0), 0);
  const avgValue = totalDocs > 0 ? revenue / totalDocs : 0;

  const monthMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = 0;
  }
  paidDocs.forEach((d) => {
    const key = (d.created_at || "").slice(0, 7);
    if (key in monthMap) monthMap[key] += d.total || 0;
  });
  const revenueByMonth = Object.entries(monthMap).map(([month, value]) => ({
    month,
    value: Math.round(value * 100) / 100,
  }));

  const statusCounts = {
    draft: docs.filter((d) => d.status === "draft").length,
    sent: sentCount,
    paid: paidCount,
    archived: docs.filter((d) => d.status === "archived").length,
  };

  const typeCounts = {
    proposal: docs.filter((d) => d.type === "proposal").length,
    invoice: docs.filter((d) => d.type === "invoice").length,
    act: docs.filter((d) => d.type === "act").length,
  };

  const clientMap = new Map<string, number>();
  docs.forEach((d) => {
    const name = d.content?.header?.client_name || "Unknown";
    clientMap.set(name, (clientMap.get(name) || 0) + (d.total || 0));
  });
  const topClients = Array.from(clientMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const recent = [...docs]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5)
    .map((d) => ({
      id: d.id,
      client: d.content?.header?.client_name || "Unknown",
      type: d.type,
      status: d.status,
      total: d.total || 0,
      date: d.created_at || "",
    }));

  return {
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
  };
}

export default async function AnalyticsPage({ params }: Props) {
  const { locale } = await params;
  const demoOrgId = await getActiveOrgId();

  const { data: docs, error } = await supabaseAdmin
    .from("documents")
    .select("type, status, total, created_at, content")
    .eq("org_id", demoOrgId);

  if (error) {
    console.error("Analytics fetch error:", error);
    notFound();
  }

  const data = computeAnalytics((docs || []) as AnalyticsDocRow[]);

  return <AnalyticsClient locale={locale as "en" | "ru"} data={data} />;
}