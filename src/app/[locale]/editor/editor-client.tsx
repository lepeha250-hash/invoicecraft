"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, FileText, Receipt, ClipboardCheck, Plus, X, Download, Save, Loader2, Copy, Trash2 } from "lucide-react";
import { getClientOrgId } from "@/lib/client-org";
import { useState, useCallback, useEffect } from "react";
import type { BillingSettings } from "@/lib/billing";
import { DEFAULT_SETTINGS, generateDocumentNumber, computeTotals } from "@/lib/billing";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

interface ServicePreset {
  label: string;
  title: string;
  items: LineItem[];
  notes: string;
  terms: string;
}

interface DocumentData {
  id: string;
  type: "proposal" | "invoice" | "act";
  title: string;
  content: {
    header: {
      company_name: string;
      company_address: string;
      client_name: string;
      client_address: string;
      number: string;
      date: string;
    };
    items: LineItem[];
    notes: string;
    terms: string;
  };
}

const SERVICE_PRESETS: Record<"en" | "ru", Record<"proposal" | "invoice" | "act", ServicePreset[]>> = {
  en: {
    proposal: [
      {
        label: "Web Development",
        title: "Website Development Proposal",
        items: [
          { id: "e1", description: "Design & UX (up to 10 pages)", quantity: 1, unit: "project", unit_price: 800 },
          { id: "e2", description: "Frontend development", quantity: 10, unit: "hours", unit_price: 60 },
          { id: "e3", description: "CMS integration", quantity: 1, unit: "setup", unit_price: 250 },
          { id: "e4", description: "Testing & QA", quantity: 1, unit: "package", unit_price: 150 },
        ],
        notes: "Includes 2 rounds of revisions and a 30-day post-launch support.",
        terms: "50% deposit before start, 50% upon delivery. Estimated timeline: 2-3 weeks. Prices in USD.",
      },
      {
        label: "Graphic Design",
        title: "Branding Design Proposal",
        items: [
          { id: "e1", description: "Logo design (3 concepts)", quantity: 1, unit: "package", unit_price: 300 },
          { id: "e2", description: "Brand guidelines", quantity: 1, unit: "document", unit_price: 150 },
          { id: "e3", description: "Business card design", quantity: 1, unit: "set", unit_price: 50 },
          { id: "e4", description: "Social media kit", quantity: 5, unit: "templates", unit_price: 20 },
        ],
        notes: "High-resolution files + source files included.",
        terms: "30% deposit, 70% on approval. Delivery within 7 business days.",
      },
      {
        label: "Consulting",
        title: "Business Consulting Proposal",
        items: [
          { id: "e1", description: "Initial audit & analysis", quantity: 1, unit: "session", unit_price: 120 },
          { id: "e2", description: "Strategy development", quantity: 3, unit: "sessions", unit_price: 150 },
          { id: "e3", description: "Implementation support", quantity: 2, unit: "weeks", unit_price: 400 },
        ],
        notes: "Includes written summary report after each session.",
        terms: "Billed in advance per session block. Valid for 14 days.",
      },
    ],
    invoice: [
      {
        label: "Web Development",
        title: "Web Development Invoice",
        items: [
          { id: "e1", description: "Website development (phase 1)", quantity: 1, unit: "project", unit_price: 1500 },
          { id: "e2", description: "Extra pages", quantity: 4, unit: "pages", unit_price: 80 },
        ],
        notes: "Thank you for your business! Payment within 7 days.",
        terms: "Payment due within 7 days. Late fees apply after 14 days.",
      },
      {
        label: "Design Services",
        title: "Design Services Invoice",
        items: [
          { id: "e1", description: "Logo & brand identity", quantity: 1, unit: "package", unit_price: 500 },
          { id: "e2", description: "Print materials", quantity: 3, unit: "items", unit_price: 40 },
        ],
        notes: "Please pay by bank transfer.",
        terms: "Due within 7 days.",
      },
    ],
    act: [
      {
        label: "Web Development",
        title: "Act of Completed Works — Website",
        items: [
          { id: "e1", description: "Website development", quantity: 1, unit: "project", unit_price: 1500 },
          { id: "e2", description: "Content integration", quantity: 1, unit: "setup", unit_price: 200 },
        ],
        notes: "Works fully completed and accepted by the client.",
        terms: "This act confirms the works have been performed in full.",
      },
    ],
  },
  ru: {
    proposal: [
      {
        label: "Разработка сайта",
        title: "Коммерческое предложение по разработке сайта",
        items: [
          { id: "e1", description: "Дизайн и UX (до 10 страниц)", quantity: 1, unit: "проект", unit_price: 40000 },
          { id: "e2", description: "Разработка фронтенда", quantity: 10, unit: "часов", unit_price: 3000 },
          { id: "e3", description: "Интеграция CMS", quantity: 1, unit: "настройка", unit_price: 12000 },
          { id: "e4", description: "Тестирование и QA", quantity: 1, unit: "пакет", unit_price: 7500 },
        ],
        notes: "Включает 2 раунда правок и поддержку в течение 30 дней после запуска.",
        terms: "Предоплата 50%, остальные 50% по готовности. Сроки: 2-3 недели.",
      },
      {
        label: "Графический дизайн",
        title: "Коммерческое предложение на брендинг",
        items: [
          { id: "e1", description: "Разработка логотипа (3 варианта)", quantity: 1, unit: "пакет", unit_price: 15000 },
          { id: "e2", description: "Гайдлайн бренда", quantity: 1, unit: "документ", unit_price: 7500 },
          { id: "e3", description: "Дизайн визиток", quantity: 1, unit: "набор", unit_price: 2500 },
          { id: "e4", description: "Оформление соцсетей", quantity: 5, unit: "шаблонов", unit_price: 1000 },
        ],
        notes: "В комплекте файлы в высоком разрешении и исходники.",
        terms: "Предоплата 30%, остальное после утверждения. Срок: 7 рабочих дней.",
      },
    ],
    invoice: [
      {
        label: "Разработка сайта",
        title: "Счёт на разработку сайта",
        items: [
          { id: "e1", description: "Разработка сайта (этап 1)", quantity: 1, unit: "проект", unit_price: 75000 },
          { id: "e2", description: "Дополнительные страницы", quantity: 4, unit: "шт", unit_price: 4000 },
        ],
        notes: "Спасибо за сотрудничество! Оплата в течение 7 дней.",
        terms: "Оплата в течение 7 дней. Пени после 14 дней просрочки.",
      },
      {
        label: "Дизайн услуги",
        title: "Счёт за дизайн-услуги",
        items: [
          { id: "e1", description: "Логотип и айдентика", quantity: 1, unit: "пакет", unit_price: 25000 },
          { id: "e2", description: "Полиграфия", quantity: 3, unit: "позиции", unit_price: 2000 },
        ],
        notes: "Просьба оплатить банковским переводом.",
        terms: "Оплата в течение 7 дней.",
      },
    ],
    act: [
      {
        label: "Разработка сайта",
        title: "Акт выполненных работ — сайт",
        items: [
          { id: "e1", description: "Разработка сайта", quantity: 1, unit: "проект", unit_price: 75000 },
          { id: "e2", description: "Интеграция контента", quantity: 1, unit: "настройка", unit_price: 10000 },
        ],
        notes: "Работы выполнены в полном объёме и приняты заказчиком.",
        terms: "Настоящий акт подтверждает выполнение работ в полном объёме.",
      },
    ],
  },
};

interface EditorClientProps {
  locale: "en" | "ru";
  initialDoc: DocumentData | null;
}

export default function EditorClient({ locale, initialDoc }: EditorClientProps) {
  const t = useTranslations("editor");
  const tc = useTranslations("common");
  const [docType, setDocType] = useState<"proposal" | "invoice" | "act">("proposal");
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unit: "pc", unit_price: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(initialDoc?.id ?? null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [companyName, setCompanyName] = useState("Your Company");
  const [companyAddress, setCompanyAddress] = useState("");
  const [settings, setSettings] = useState<BillingSettings>(DEFAULT_SETTINGS);
  const [seq, setSeq] = useState(0);

  useEffect(() => {
    fetch(`/api/settings/${demoOrgId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          brand: { ...DEFAULT_SETTINGS.brand, ...data.brand },
          numbering: { ...DEFAULT_SETTINGS.numbering, ...data.numbering },
          tax: { ...DEFAULT_SETTINGS.tax, ...data.tax },
        });
        if (data.brand?.name) setCompanyName(data.brand.name);
        if (data.brand?.address) setCompanyAddress(data.brand.address);
      })
      .catch(() => {});
  }, []);

  const presets = SERVICE_PRESETS[locale]?.[docType] ?? [];
  const currency = locale === "ru" ? "₽" : "$";
  const demoOrgId = getClientOrgId();
  const accentColor = settings.brand?.accent_color || "#2563eb";

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: "", quantity: 1, unit: "pcs", unit_price: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const subTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totals = computeTotals(subTotal, settings);

  const buildContent = () => {
    const number = generateDocumentNumber(docType, seq, settings);
    return {
      header: {
        company_name: companyName,
        company_address: companyAddress,
        client_name: clientName || "Client",
        client_address: clientAddress,
        number,
        date: new Date().toLocaleDateString(),
      },
      items,
      notes,
      terms,
    };
  };

  const applyPreset = (preset: ServicePreset) => {
    setTitle(preset.title);
    setItems(preset.items.map((i) => ({ ...i, id: Date.now().toString() + Math.random() })));
    setNotes(preset.notes);
    setTerms(preset.terms);
  };

  const saveDocument = useCallback(async () => {
    setSaving(true);
    try {
      const content = buildContent();
      if (savedId) {
        const res = await fetch(`/api/documents/${savedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (!res.ok) throw new Error("update failed");
        const doc = await res.json();
        setSavedId(doc.id);
      } else {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_id: demoOrgId,
            type: docType,
            title: title || "Untitled Document",
            content,
            currency: locale === "ru" ? "RUB" : "USD",
          }),
        });
        if (!res.ok) throw new Error("create failed");
        const doc = await res.json();
        setSavedId(doc.id);
        setSeq((s) => s + 1);
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `?id=${doc.id}`);
        }
      }
      setLastSaved(new Date());
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  }, [savedId, docType, title, clientName, clientAddress, items, notes, terms, companyName, companyAddress, seq, settings, locale]);

  const duplicateDocument = async () => {
    setSaving(true);
    try {
      const content = buildContent();
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: demoOrgId,
          type: docType,
          title: `${title} (Copy)`,
          content,
        }),
      });
      if (!res.ok) throw new Error("duplicate failed");
      const doc = await res.json();
      setSavedId(doc.id);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `?id=${doc.id}`);
      }
    } catch (e) {
      console.error("Duplicate error:", e);
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    const content = buildContent();
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, settings }),
      });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${content.header.number || title || "document"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF export error:", e);
    }
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("newDocument")}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("type")}: {t(`types.${docType}`)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1.5" onClick={saveDocument} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {tc("save")}
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={duplicateDocument} disabled={saving}>
                <Copy className="w-4 h-4" />
                {t("duplicate")}
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={exportPDF}>
                <Download className="w-4 h-4" />
                {t("exportPDF")}
              </Button>
            </div>
          </div>

          {lastSaved && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {t("lastSaved")}: {lastSaved.toLocaleTimeString()}
            </div>
          )}

          <Card className="border-border/50 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wand2 className="w-4 h-4 text-primary" />
                {t("quickStart")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <Select value={docType} onValueChange={(v) => setDocType(v as typeof docType)}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposal">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        {t("types.proposal")}
                      </div>
                    </SelectItem>
                    <SelectItem value="invoice">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-3.5 h-3.5" />
                        {t("types.invoice")}
                      </div>
                    </SelectItem>
                    <SelectItem value="act">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        {t("types.act")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">{t("choosePreset")}</Label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="gap-1.5"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {preset.label}
                    </Button>
                  ))}
                  {presets.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("noPresets")}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("title")}</Label>
                <Input
                  placeholder={t("untitled")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("client")}</Label>
                <Input
                  placeholder="Client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
            </div>

            {clientName && (
              <div className="space-y-2">
                <Label>Client Address</Label>
                <Input
                  placeholder="123 Main St, City, Country"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">{t("items")}</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  {t("addItem")}
                </Button>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <Card key={item.id} className="border-border/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-muted-foreground mt-2.5 w-6">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-5">
                            <Label className="text-xs">{t("description")}</Label>
                            <Input
                              placeholder="Service description"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">{t("quantity")}</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, "quantity", parseInt(e.target.value) || 1)
                              }
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">{t("unit")}</Label>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">{t("unitPrice")}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price || ""}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "unit_price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                          <div className="md:col-span-1 flex items-end">
                            {items.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                onClick={() => removeItem(item.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-border/50 mt-3">
                <CardContent className="py-3 space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t("subtotal")}</span>
                    <span>{currency}{subTotal.toLocaleString()}</span>
                  </div>
                  {totals.taxAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{totals.taxLabel} ({totals.taxRate}%)</span>
                      <span>{currency}{totals.taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm">{t("total")}</span>
                    <span className="text-lg text-primary">
                      {currency}{totals.total.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("notes")}</Label>
                <Textarea
                  placeholder={t("notesPlaceholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("terms")}</Label>
                <Textarea
                  placeholder={t("termsPlaceholder")}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pb-8">
              <Button variant="outline" onClick={saveDocument} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {tc("save")}
              </Button>
              <Button onClick={exportPDF} className="gap-2">
                <Download className="w-4 h-4" />
                {t("exportPDF")}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}