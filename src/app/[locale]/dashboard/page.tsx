"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Receipt,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  const stats = [
    { title: t("totalDocs"), value: "0", icon: FileText },
    { title: t("thisMonth"), value: "0", icon: TrendingUp },
    { title: t("totalRevenue"), value: "$0", icon: Receipt },
  ];

  const quickActions = [
    {
      title: t("newProposal"),
      type: "proposal" as const,
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: t("newInvoice"),
      type: "invoice" as const,
      icon: Receipt,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: t("newAct"),
      type: "act" as const,
      icon: ClipboardCheck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold">{t("welcome", { name: "User" })}</h1>
            <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold mb-4">{t("quickActions")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.type} href={`/editor?type=${action.type}`}>
                  <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center`}>
                            <action.icon className={`w-5 h-5 ${action.color}`} />
                          </div>
                          <span className="font-medium">{action.title}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          {/* Recent Documents */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t("recentDocs")}</h2>
              <Link href="/documents">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  {t("viewAll")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <Card className="border-border/50">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">{t("emptyTitle")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t("emptyDesc")}</p>
                  <Link href="/editor">
                    <Button size="sm" className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      {t("createFirst")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
