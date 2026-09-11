"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getClientOrgId } from "@/lib/client-org";
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
  Key,
  Loader2,
  Trash2,
  Copy,
  Check,
  Code2,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

interface ApiClientProps {
  keys: ApiKeyRow[];
}

export default function ApiClient({ keys }: ApiClientProps) {
  const t = useTranslations("apiPage");
  const tc = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const orgId = getClientOrgId();

  const handleCreate = async () => {
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setCreatedKey(data.api_key || null);
      setOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    setDeletingId(id);
    try {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const copyKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const exampleCurl = `curl ${baseUrl}/api/v1/documents \\
  -H "Authorization: Bearer $KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"invoice","title":"Monthly retainer","content":{
    "header":{"client_name":"Acme","client_address":"Berlin"},
    "items":[{"id":"1","description":"Design","quantity":10,"unit_price":25}]}}'`;

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
                    {t("createKey")}
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("createKey")}</DialogTitle>
                  <DialogDescription>{t("createKeyDescription")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>{t("keyName")}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("keyNamePlaceholder")} />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    {tc("cancel")}
                  </Button>
                  <Button onClick={handleCreate} disabled={saving || !name} className="gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {createdKey && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-700">
                  <Key className="w-4 h-4" />
                  {t("keyCreated")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg bg-muted/50 px-3 py-2 text-xs">{createdKey}</code>
                  <Button variant="outline" size="sm" onClick={copyKey} className="gap-1 shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t("copied") : t("copy")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("storeKeyWarning")}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="w-4 h-4" />
                {t("keysTitle")}
              </CardTitle>
              <CardDescription>{t("keysDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {keys.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("keysEmpty")}</p>
              ) : (
                <div className="space-y-2">
                  {keys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{key.name}</p>
                            <Badge variant={key.revoked ? "secondary" : "default"} className="text-xs">
                              {key.revoked ? t("revoked") : t("active")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}••••••••</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {key.last_used_at
                            ? t("usedAt") + " " + new Date(key.last_used_at).toLocaleDateString()
                            : t("neverUsed")}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(key.id)}
                          disabled={deletingId === key.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code2 className="w-4 h-4" />
                {t("docsTitle")}
              </CardTitle>
              <CardDescription>{t("docsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="font-mono text-xs text-muted-foreground">GET</p>
                  <p className="font-mono truncate text-xs mt-1">/api/v1/documents</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("endpointList")}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="font-mono text-xs text-emerald-600">POST</p>
                  <p className="font-mono truncate text-xs mt-1">/api/v1/documents</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("endpointCreate")}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="font-mono text-xs text-blue-600">GET</p>
                  <p className="font-mono truncate text-xs mt-1">/api/v1/stats</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("endpointStats")}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium mb-2">{t("exampleTitle")}</p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">{exampleCurl}</pre>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>{t("authNote")}</p>
                <div className="space-y-1">
                  {t("eventsList").split("|").map((ev, i) => (
                    <p key={i}>• {ev}</p>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {baseUrl ? `${baseUrl}/api/v1/stats` : t("serverNote")}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}