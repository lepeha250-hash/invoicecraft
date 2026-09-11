"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { getClientOrgId } from "@/lib/client-org";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Trash2,
  Play,
  Mail,
  Send,
  MailCheck,
  Power,
  PowerOff,
  Pencil,
} from "lucide-react";
import { useState } from "react";

interface SequenceStep {
  delay_days: number;
  subject: string;
  body: string;
}

interface Sequence {
  id: string;
  org_id: string;
  name: string;
  trigger_type: "document_sent" | "invoice_unpaid";
  document_type: "proposal" | "invoice" | "act" | null;
  steps: SequenceStep[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface SequenceLog {
  id: string;
  sequence_id: string;
  document_id: string;
  step_index: number;
  status: "scheduled" | "sent" | "skipped";
  scheduled_at: string | null;
  sent_at: string | null;
  to_email: string | null;
  subject: string | null;
  created_at: string;
}

interface SequencesClientProps {
  sequences: Sequence[];
  logs: SequenceLog[];
}

const emptyStep = (): SequenceStep => ({
  delay_days: 3,
  subject: "",
  body: "",
});

export default function SequencesClient({
  sequences,
  logs,
}: SequencesClientProps) {
  const t = useTranslations("sequences");
  const tc = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sequence | null>(null);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<"document_sent" | "invoice_unpaid">("document_sent");
  const [documentType, setDocumentType] = useState<string>("__all");
  const [steps, setSteps] = useState<SequenceStep[]>([emptyStep()]);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const orgId = getClientOrgId();

  const openCreate = () => {
    setEditing(null);
    setName("");
    setTriggerType("document_sent");
    setDocumentType("__all");
    setSteps([emptyStep()]);
    setActive(true);
    setOpen(true);
  };

  const openEdit = (seq: Sequence) => {
    setEditing(seq);
    setName(seq.name);
    setTriggerType(seq.trigger_type);
    setDocumentType(seq.document_type || "__all");
    setSteps(seq.steps.length ? seq.steps.map((s) => ({ ...s })) : [emptyStep()]);
    setActive(seq.active);
    setOpen(true);
  };

  const updateStep = (idx: number, patch: Partial<SequenceStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const handleSave = async () => {
    if (!name || steps.length === 0) return;
    setSaving(true);
    try {
      const body = {
        org_id: orgId,
        name,
        trigger_type: triggerType,
        document_type: documentType === "__all" ? null : documentType,
        steps,
        active,
      };
      const res = await fetch(
        editing ? `/api/sequences/${editing.id}` : "/api/sequences",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("Save failed");
      setOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/sequences/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error("Run failed");
      setRunResult(t("runResult", { sent: data.sent }) || "");
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const handleToggleActive = async (seq: Sequence) => {
    setTogglingId(seq.id);
    try {
      await fetch(`/api/sequences/${seq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !seq.active }),
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
      await fetch(`/api/sequences/${id}`, { method: "DELETE" });
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const triggerLabels: Record<string, string> = {
    document_sent: t("triggerSent"),
    invoice_unpaid: t("triggerUnpaid"),
  };

  const typeLabels: Record<string, string> = {
    __all: t("allTypes"),
    proposal: t("proposal"),
    invoice: t("invoice"),
    act: t("act"),
  };

  const statusLabels: Record<string, string> = {
    scheduled: t("logScheduled"),
    sent: t("logSent"),
    skipped: t("logSkipped"),
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRunNow} disabled={running} className="gap-2">
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {t("runNow")}
              </Button>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                {t("new")}
              </Button>
            </div>
          </div>

          {runResult && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              {runResult}
            </p>
          )}

          {sequences.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("emptyTitle")}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{t("emptyDescription")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sequences.map((seq) => (
                <Card key={seq.id} className="border-border/50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{seq.name}</h3>
                            <Badge variant={seq.active ? "default" : "secondary"} className="text-xs">
                              {seq.active ? t("active") : t("inactive")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {triggerLabels[seq.trigger_type]} · {typeLabels[seq.document_type || "__all"]} ·
                            {seq.steps.length} {t("stepsCount")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {seq.steps.map((step, idx) => (
                          <div key={idx} className="hidden md:block">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">{idx + 1}</span> · D+
                              {step.delay_days}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {step.subject}
                            </div>
                          </div>
                        ))}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(seq)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={seq.active ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleActive(seq)}
                          disabled={togglingId === seq.id}
                        >
                          {seq.active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                          {seq.active ? t("pause") : t("resume")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(seq.id)}
                          disabled={deletingId === seq.id}
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
                <Send className="w-4 h-4" />
                {t("logsTitle")}
              </CardTitle>
              <CardDescription>{t("logsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("logsEmpty")}</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <MailCheck className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{log.subject || log.to_email || "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {log.to_email || t("noEmail")} · {t("lastStep")} {log.step_index + 1}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={log.status === "sent" ? "default" : "secondary"} className="text-xs">
                          {statusLabels[log.status] || log.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.sent_at || log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? t("editTitle") : t("newTitle")}</DialogTitle>
              <DialogDescription>{t("newDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("trigger")}</Label>
                  <Select
                    value={triggerType}
                    onValueChange={(v) => setTriggerType(v as "document_sent" | "invoice_unpaid")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document_sent">{t("triggerSent")}</SelectItem>
                      <SelectItem value="invoice_unpaid">{t("triggerUnpaid")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("documentType")}</Label>
                  <Select value={documentType} onValueChange={(v) => setDocumentType(v || "__all")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">{t("allTypes")}</SelectItem>
                      <SelectItem value="proposal">{t("proposal")}</SelectItem>
                      <SelectItem value="invoice">{t("invoice")}</SelectItem>
                      <SelectItem value="act">{t("act")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>{t("steps")}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSteps((prev) => [...prev, emptyStep()])}
                  className="gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("addStep")}
                </Button>
              </div>

              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="rounded-lg border border-border/50 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {t("stepNumber", { n: idx + 1 })}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        disabled={steps.length === 1}
                        onClick={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("delay")}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={step.delay_days}
                        onChange={(e) => updateStep(idx, { delay_days: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground -mt-1.5">{t("delayHint")}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("subject")}</Label>
                      <Input
                        value={step.subject}
                        onChange={(e) => updateStep(idx, { subject: e.target.value })}
                        placeholder={t("subjectPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("body")}</Label>
                      <Textarea
                        rows={3}
                        value={step.body}
                        onChange={(e) => updateStep(idx, { body: e.target.value })}
                        placeholder={t("bodyPlaceholder")}
                      />
                      <p className="text-xs text-muted-foreground -mt-0.5">{t("bodyHint")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !name || steps.some((s) => !s.subject || !s.body)}
                className="gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}