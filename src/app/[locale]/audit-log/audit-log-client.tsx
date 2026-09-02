"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, ShieldCheck, History } from "lucide-react";
import { useState } from "react";

interface AuditEntry {
  id: string;
  org_id: string;
  actor: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface AuditLogClientProps {
  locale: "en" | "ru";
  entries: AuditEntry[];
}

const FILTERS = ["all", "document", "api_key", "settings", "organization", "webhook", "other"] as const;

export default function AuditLogClient({ locale, entries }: AuditLogClientProps) {
  const t = useTranslations("auditLog");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const filtered = entries.filter((e) => {
    if (filter === "all") return true;
    if (filter === "other") {
      return !["document", "api_key", "settings", "organization", "webhook"].includes(e.entity_type || "");
    }
    return (e.entity_type || "").includes(filter);
  });

  const actionLabels: Record<string, string> = {
    "document.created": t("docCreated"),
    "document.updated": t("docUpdated"),
    "document.sent": t("docSent"),
    "document.paid": t("docPaid"),
    "document.signed": t("docSigned"),
    "document.archived": t("docArchived"),
    "document.deleted": t("docDeleted"),
    "settings.updated": t("settingsUpdated"),
    "api_key.created": t("keyCreated"),
    "api_key.deleted": t("keyDeleted"),
    "api_key.revoked": t("keyRevoked"),
    "api_key.unrevoked": t("keyUnrevoked"),
  };

  const entityLabels: Record<string, string> = {
    document: t("entityDocument"),
    api_key: t("entityApiKey"),
    organization: t("entityOrganization"),
    settings: t("entitySettings"),
    webhook: t("entityWebhook"),
  };

  const actionColor = (action: string) => {
    if (action.includes("deleted") || action.includes("revoked")) return "destructive";
    if (action.includes("paid") || action.includes("created")) return "default";
    if (action.includes("sent") || action.includes("signed")) return "secondary";
    return "outline";
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-primary" />
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {t(`filter_${f}`)}
              </button>
            ))}
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-4 h-4" />
                {t("eventsTitle")} ({filtered.length})
              </CardTitle>
              <CardDescription>{t("eventsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("empty")}</p>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={actionColor(e.action)} className="text-xs">
                              {actionLabels[e.action] || e.action}
                            </Badge>
                            {e.entity_type && (
                              <span className="text-xs text-muted-foreground">
                                {entityLabels[e.entity_type] || e.entity_type}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("by")} <span className="font-medium text-foreground">{e.actor}</span>
                            {e.entity_id && (
                              <>
                                {" · "}
                                <span className="font-mono">{e.entity_id.slice(0, 8)}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(e.created_at).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        {new Date(e.created_at).toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}