"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  TrendingUp,
  Receipt,
  DollarSign,
  ArrowUpRight,
  ClipboardCheck,
  Users,
  Clock,
  BarChart3,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

interface AnalyticsData {
  summary: {
    totalDocs: number;
    sentCount: number;
    paidCount: number;
    revenue: number;
    conversionRate: number;
    pipeline: number;
    avgValue: number;
  };
  revenueByMonth: { month: string; value: number }[];
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  topClients: { name: string; value: number }[];
  recent: {
    id: string;
    client: string;
    type: string;
    status: string;
    total: number;
    date: string;
  }[];
}

interface AnalyticsClientProps {
  locale: "en" | "ru";
  data: AnalyticsData;
}

export default function AnalyticsClient({ locale, data }: AnalyticsClientProps) {
  const t = useTranslations("analytics");
  const { summary, revenueByMonth, statusCounts, typeCounts, topClients, recent } = data;

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
      style: "currency",
      currency: locale === "ru" ? "RUB" : "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.value), 1);

  const statusMeta: Record<string, { color: string; label: string }> = {
    draft: { color: "bg-muted text-muted-foreground", label: t("draft") },
    sent: { color: "bg-blue-500/10 text-blue-600", label: t("sent") },
    paid: { color: "bg-green-500/10 text-green-600", label: t("paid") },
    archived: { color: "bg-gray-500/10 text-gray-600", label: t("archived") },
  };

  const typeMeta: Record<string, { color: string; label: string }> = {
    proposal: { color: "bg-blue-500", label: t("proposal") },
    invoice: { color: "bg-green-500", label: t("invoice") },
    act: { color: "bg-purple-500", label: t("act") },
  };

  const summaryCards = [
    { title: t("totalDocs"), value: String(summary.totalDocs), icon: FileText, tint: "text-blue-500 bg-blue-500/10" },
    { title: t("revenue"), value: fmt(summary.revenue), icon: DollarSign, tint: "text-green-500 bg-green-500/10" },
    { title: t("pipeline"), value: fmt(summary.pipeline), icon: Clock, tint: "text-amber-500 bg-amber-500/10" },
    { title: t("conversion"), value: `${summary.conversionRate}%`, icon: TrendingUp, tint: "text-purple-500 bg-purple-500/10" },
    { title: t("paidDocs"), value: String(summary.paidCount), icon: Receipt, tint: "text-emerald-500 bg-emerald-500/10" },
    { title: t("avgValue"), value: fmt(summary.avgValue), icon: BarChart3, tint: "text-rose-500 bg-rose-500/10" },
  ];

  const totalByType = Object.values(typeCounts).reduce((a, b) => a + b, 0) || 1;
  const totalByStatus = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {summaryCards.map((card) => (
              <Card key={card.title} className="border-border/50">
                <CardContent className="pt-5">
                  <div className={`w-8 h-8 rounded-lg ${card.tint} flex items-center justify-center mb-3`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="text-xl font-bold mt-0.5">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue chart */}
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-4 h-4" />
                  {t("revenueTimeline")}
                </CardTitle>
                <CardDescription>{t("revenueTimelineDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-48">
                  {revenueByMonth.map((m) => {
                    const height = m.value > 0 ? Math.max((m.value / maxRevenue) * 100, 4) : 2;
                    const [year, month] = m.month.split("-");
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group" title={`${month}.${year}: ${fmt(m.value)}`}>
                        <div className="w-full flex justify-center">
                          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {fmt(m.value)}
                          </span>
                        </div>
                        <div
                          className={`w-full max-w-[28px] rounded-t-md transition-colors ${m.value > 0 ? "bg-primary/70 hover:bg-primary" : "bg-muted/40"}`}
                          style={{ height: `${height * 1.6}px` }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {month}.{year.slice(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Donut: by type */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="w-4 h-4" />
                  {t("byType")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(["proposal", "invoice", "act"] as const).map((type) => {
                  const count = typeCounts[type] || 0;
                  const pct = Math.round((count / totalByType) * 100);
                  const meta = typeMeta[type];
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${meta.color}`} />
                          {meta.label}
                        </span>
                        <span className="text-muted-foreground">{count} · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${meta.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top clients */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  {t("topClients")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("noClients")}</p>
                ) : (
                  topClients.map((client, i) => {
                    const max = topClients[0]?.value || 1;
                    return (
                      <div key={client.name} className="flex items-center gap-3">
                        <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{client.name}</span>
                            <span className="text-sm text-muted-foreground">{fmt(client.value)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${(client.value / max) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Status distribution */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="w-4 h-4" />
                  {t("statusDistribution")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {(["draft", "sent", "paid", "archived"] as const).map((status) => {
                    const count = statusCounts[status] || 0;
                    const pct = Math.round((count / totalByStatus) * 100);
                    const meta = statusMeta[status];
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <Badge variant="outline" className={`capitalize ${meta.color}`}>
                          {meta.label}
                        </Badge>
                        <div className="flex items-center gap-3 flex-1 ml-4">
                          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-2">
                  {recent.slice(0, 4).map((doc) => {
                    const meta = statusMeta[doc.status] || statusMeta.draft;
                    return (
                      <Link
                        key={doc.id}
                        href={`/editor?id=${doc.id}`}
                        className="flex items-center justify-between rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{doc.client}</span>
                        </div>
                        <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${meta.color}`}>
                          {meta.label}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}