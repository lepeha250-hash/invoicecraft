"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { getClientOrgId } from "@/lib/client-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, Play, CalendarClock, Repeat } from "lucide-react";
import { useState } from "react";

interface RecurringDoc {
  id: string;
  org_id: string;
  title: string;
  cadence: "weekly" | "monthly" | "quarterly" | "yearly";
  next_run_at: string;
  last_run_at: string | null;
  active: boolean;
  total: number;
  currency: string;
  client_name: string | null;
  client_email: string | null;
}

interface RecurringClientProps {
  locale: "en" | "ru";
  recurring: RecurringDoc[];
}

const cadences = ["weekly", "monthly", "quarterly", "yearly"] as const;

export default function RecurringClient({ locale, recurring }: RecurringClientProps) {
  const t = useTranslations("recurring");
  const tc = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<(typeof cadences)[number]>("monthly");
  const [total, setTotal] = useState("100");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const orgId = getClientOrgId();

  const handleCreate = async () => {
    if (!title || !total) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          title,
          cadence,
          total: parseFloat(total),
          client_name: clientName || undefined,
          client_email: clientEmail || undefined,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      setOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async (id: string) => {
    setRunningId(id);
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_now" }),
      });
      if (!res.ok) throw new Error("Run failed");
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setRunningId(null);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recurring billing rule?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const cadenceLabels: Record<string, string> = {
    weekly: t("weekly"),
    monthly: t("monthly"),
    quarterly: t("quarterly"),
    yearly: t("yearly"),
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
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
                    {t("new")}
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("newTitle")}</DialogTitle>
                  <DialogDescription>{t("newDescription")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("documentTitle")}</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Monthly retainer" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("cadence")}</Label>
                    <Select value={cadence} onValueChange={(v) => setCadence(v as (typeof cadences)[number])}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cadences.map((c) => (
                          <SelectItem key={c} value={c}>
                            {cadenceLabels[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("amount")}</Label>
                    <Input
                      type="number"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("clientName")}</Label>
                      <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("clientEmail")}</Label>
                      <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    {tc("cancel")}
                  </Button>
                  <Button onClick={handleCreate} disabled={saving || !title || !total} className="gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {recurring.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Repeat className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("emptyTitle")}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{t("emptyDescription")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recurring.map((rec) => (
                <Card key={rec.id} className="border-border/50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <CalendarClock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{rec.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {cadenceLabels[rec.cadence]} · {rec.client_name || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-semibold">
                            {new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
                              style: "currency",
                              currency: rec.currency,
                            }).format(rec.total)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("nextRun")} {new Date(rec.next_run_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant={rec.active ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleActive(rec.id, rec.active)}
                        >
                          {rec.active ? t("pause") : t("resume")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunNow(rec.id)}
                          disabled={runningId === rec.id}
                          className="gap-1"
                        >
                          {runningId === rec.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          {t("runNow")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(rec.id)}
                          disabled={deletingId === rec.id}
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
        </div>
      </main>
    </div>
  );
}