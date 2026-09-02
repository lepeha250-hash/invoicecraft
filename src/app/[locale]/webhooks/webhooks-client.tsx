"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { getClientOrgId } from "@/lib/client-org";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Webhook,
  Loader2,
  Trash2,
  Play,
  Check,
  Copy,
  Power,
  PowerOff,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

interface WebhookRow {
  id: string;
  org_id: string;
  url: string;
  events: string[];
  secret?: string | null;
  active: boolean;
  created_at: string;
}

interface DeliveryRow {
  id: string;
  webhook_id: string;
  event: string;
  status: "delivered" | "failed";
  response_status: number | null;
  created_at: string;
}

interface WebhooksClientProps {
  locale: "en" | "ru";
  webhooks: WebhookRow[];
  deliveries: DeliveryRow[];
}

export const WEBHOOK_EVENTS = [
  "document.created",
  "document.updated",
  "document.sent",
  "document.paid",
  "document.signed",
  "document.archived",
  "document.deleted",
] as const;

export default function WebhooksClient({ locale, webhooks, deliveries }: WebhooksClientProps) {
  const t = useTranslations("webhooksPage");
  const tc = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["document.sent", "document.paid"]);
  const [saving, setSaving] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; status: string } | null>(null);

  const orgId = getClientOrgId();

  const toggleEvent = (ev: string) => {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  const handleCreate = async () => {
    if (!url || events.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/webhooks?org_id=${orgId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setCreatedSecret(data.secret || null);
      setOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (wh: WebhookRow) => {
    setTogglingId(wh.id);
    try {
      await fetch(`/api/webhooks/${wh.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !wh.active }),
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    setDeletingId(id);
    try {
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ id, ok: data.status === "delivered", status: data.status });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestingId(null);
    }
  };

  const copySecret = async () => {
    if (!createdSecret) return;
    await navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eventShort: Record<string, string> = {
    "document.created": "created",
    "document.updated": "updated",
    "document.sent": "sent",
    "document.paid": "paid",
    "document.signed": "signed",
    "document.archived": "archived",
    "document.deleted": "deleted",
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t("addWebhook")}
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("newWebhook")}</DialogTitle>
                  <DialogDescription>{t("newWebhookDescription")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("endpointUrl")}</Label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/hooks/invoicecraft"
                    />
                    <p className="text-xs text-muted-foreground">{t("urlHint")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("events")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {WEBHOOK_EVENTS.map((ev) => (
                        <button
                          key={ev}
                          type="button"
                          onClick={() => toggleEvent(ev)}
                          className={`rounded-lg border px-3 py-2 text-xs text-left transition-colors ${
                            events.includes(ev)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          {eventShort[ev] || ev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    {tc("cancel")}
                  </Button>
                  <Button onClick={handleCreate} disabled={saving || !url || events.length === 0} className="gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {createdSecret && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-700">
                  <Webhook className="w-4 h-4" />
                  {t("secretTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg bg-muted/50 px-3 py-2 text-xs">{createdSecret}</code>
                  <Button variant="outline" size="sm" onClick={copySecret} className="gap-1 shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t("copied") : t("copy")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("secretHint")}</p>
              </CardContent>
            </Card>
          )}

          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${
                testResult.ok
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {testResult.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {testResult.ok ? t("testOk") : (t("testFail") + " (" + testResult.status + ")")}
            </div>
          )}

          {webhooks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Webhook className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("emptyTitle")}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{t("emptyDescription")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <Card key={wh.id} className="border-border/50">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{wh.url}</h3>
                          <Badge variant={wh.active ? "default" : "secondary"} className="text-xs shrink-0">
                            {wh.active ? t("active") : t("inactive")}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {wh.events.map((ev) => (
                            <Badge key={ev} variant="outline" className="text-xs">
                              {eventShort[ev] || ev}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(wh.id)}
                          disabled={testingId === wh.id}
                          className="gap-1"
                        >
                          {testingId === wh.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          {t("test")}
                        </Button>
                        <Button
                          variant={wh.active ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggle(wh)}
                          disabled={togglingId === wh.id}
                        >
                          {wh.active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(wh.id)}
                          disabled={deletingId === wh.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Webhook className="w-4 h-4" />
                {t("deliveriesTitle")}
              </CardTitle>
              <CardDescription>{t("deliveriesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {deliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("deliveriesEmpty")}</p>
              ) : (
                <div className="space-y-2">
                  {deliveries.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-xs">
                          {d.event}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {d.response_status ? `HTTP ${d.response_status}` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={d.status === "delivered" ? "default" : "destructive"} className="text-xs">
                          {d.status === "delivered" ? t("delivered") : t("failed")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString()} {new Date(d.created_at).toLocaleTimeString().slice(0, 5)}
                        </span>
                      </div>
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