"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Receipt, ClipboardCheck, Plus, Search, Pencil, Trash2, Copy, Archive, Loader2, CheckSquare } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { useState } from "react";
import { getClientOrgId } from "@/lib/client-org";

interface DocItem {
  id: string;
  type: "proposal" | "invoice" | "act";
  title: string;
  content: {
    header: { client_name: string };
  };
  created_at: string;
  total: number;
}

const typeMeta = {
  proposal: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  invoice: { icon: Receipt, color: "text-green-500", bg: "bg-green-500/10" },
  act: { icon: ClipboardCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
} as const;

interface DocumentsClientProps {
  documents: DocItem[];
  search: string;
}

export default function DocumentsClient({ documents, search }: DocumentsClientProps) {
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  const [localSearch, setLocalSearch] = useState(search);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(localSearch.toLowerCase()) ||
    doc.content?.header?.client_name?.toLowerCase().includes(localSearch.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((d) => d.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkExport = async () => {
    if (selected.size === 0) return;
    setExporting(true);
    try {
      const res = await fetch("/api/pdf/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: getClientOrgId(),
          ids: Array.from(selected),
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = match ? match[1] : "invoicecraft_documents.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      window.location.reload();
    } catch (e) {
      console.error("Delete error:", e);
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) return;
      const doc = await res.json();
      const createRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: getClientOrgId(),
          type: doc.type,
          title: `${doc.title} (Copy)`,
          content: doc.content,
        }),
      });
      if (createRes.ok) window.location.reload();
    } catch (e) {
      console.error("Duplicate error:", e);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("documents")}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {documents.length} {t("documents").toLowerCase()}
              </p>
            </div>
            <Link href="/editor">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {tn("newDocument")}
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-[#2563eb] cursor-pointer shrink-0"
              checked={allSelected}
              onChange={toggleAll}
              title="Select all"
            />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                className="pl-9"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                {selected.size} {t("selected")}
              </p>
              <Button size="sm" onClick={handleBulkExport} disabled={exporting} className="gap-1.5">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                {t("exportZip")}
              </Button>
            </div>
          )}

          {filtered.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">{t("noData")}</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first document
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((documentItem) => {
                const meta = typeMeta[documentItem.type];
                const Icon = meta.icon;
                return (
                  <Card key={documentItem.id} className="border-border/50">
                    <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-[#2563eb] cursor-pointer shrink-0"
                      checked={selected.has(documentItem.id)}
                      onChange={() => toggleOne(documentItem.id)}
                    />
                    <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                          <div>
                            <h3 className="font-medium">{documentItem.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {documentItem.content?.header?.client_name || "—"} &middot; {new Date(documentItem.created_at).toLocaleDateString()} &middot; ${documentItem.total?.toLocaleString() || "0"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="capitalize">
                            {documentItem.type}
                          </Badge>
                          <Link href={`/editor?id=${documentItem.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(documentItem.id)} title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(documentItem.id)} disabled={deletingId === documentItem.id} title="Delete">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}