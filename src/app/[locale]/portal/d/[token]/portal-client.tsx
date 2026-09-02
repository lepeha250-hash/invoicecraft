"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Download, FileText, Receipt, ClipboardCheck, AlertCircle, Loader2, CreditCard, Signature } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { BillingSettings } from "@/lib/billing";

interface ShareData {
  id: string;
  token: string;
  email: string;
  status: string;
  expires_at: string;
  documents: {
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
      items: Array<{
        id: string;
        description: string;
        quantity: number;
        unit: string;
        unit_price: number;
      }>;
      notes: string;
      terms: string;
    };
    status: string;
    total: number;
    currency: string;
  };
}

interface PortalClientProps {
  locale: "en" | "ru";
  share: ShareData;
  settings?: BillingSettings;
}

export default function PortalClient({ locale, share, settings }: PortalClientProps) {
  const t = useTranslations("portal");
  const [docStatus, setDocStatus] = useState(share.status);
  const [signing, setSigning] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const brand = settings?.brand || {};
  const wl = settings?.whiteLabel || {};
  const accent = brand.accent_color || "#2563eb";
  const portalName = wl.active && wl.portal_name ? wl.portal_name : brand.name || "InvoiceCraft";
  const hideBranding = wl.active && wl.hide_branding;

  const currency = locale === "ru" ? "₽" : "$";
  const doc = share.documents as ShareData["documents"];

  const total = doc.content?.items?.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
    0
  ) || doc.total || 0;

  useEffect(() => {
    if (docStatus === "pending") {
      setDocStatus("viewed");
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature(null);
  };

  const handleSign = async () => {
    if (!signature) return alert("Please sign first");
    setSigning(true);
    try {
      const res = await fetch("/api/portal/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: share.token, signature }),
      });
      if (!res.ok) throw new Error("Sign failed");
      setDocStatus("signed");
      setSigning(false);
    } catch (e) {
      console.error("Sign error:", e);
      setSigning(false);
    }
  };

  const handlePay = async () => {
    if (doc.type !== "invoice") return;
    setPaying(true);
    setPayError(false);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "payment",
          documentId: doc.id,
          amount: doc.total || total,
          currency: doc.currency || "usd",
          email: share.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Pay failed");
      window.location.href = data.url;
    } catch (e) {
      console.error("Pay error:", e);
      setPayError(true);
    } finally {
      setPaying(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: doc.content, settings }),
      });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF error:", e);
    }
  };

  const typeLabels: Record<"en" | "ru", Record<string, string>> = {
    en: { proposal: "Proposal", invoice: "Invoice", act: "Act" },
    ru: { proposal: "Предложение", invoice: "Счёт", act: "Акт" },
  };

  const statusLabels: Record<"en" | "ru", Record<string, string>> = {
    en: { pending: "Pending", viewed: "Viewed", signed: "Signed", paid: "Paid" },
    ru: { pending: "Ожидает", viewed: "Просмотрен", signed: "Подписан", paid: "Оплачен" },
  };

  const statusColors = {
    pending: "bg-yellow-500",
    viewed: "bg-blue-500",
    signed: "bg-green-500",
    paid: "bg-emerald-500",
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: accent }}
          >
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{portalName}</h1>
          <p className="text-muted-foreground mt-1">{t("secureAccess")}</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className={`capitalize ${statusColors[docStatus as keyof typeof statusColors] || "bg-gray-500"}`}>
                  {statusLabels[locale as "en" | "ru"]?.[docStatus as keyof typeof statusLabels] || docStatus}
                </Badge>
                <Badge variant="outline" className="ml-2 capitalize">
                  {typeLabels[locale as "en" | "ru"]?.[doc.type] || doc.type}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t("documentNumber")}</p>
                <p className="font-medium">{doc.content?.header?.number || "—"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-t border-border/50 pt-6">
              <h2 className="text-xl font-semibold">{doc.title}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <p className="text-muted-foreground">{t("from")}</p>
                  <p className="font-medium">{doc.content?.header?.company_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("to")}</p>
                  <p className="font-medium">{doc.content?.header?.client_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("date")}</p>
                  <p className="font-medium">{doc.content?.header?.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("total")}</p>
                  <p className="font-bold text-lg text-primary">{currency}{total.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              {doc.content?.items?.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × {currency}{item.unit_price}</p>
                    </div>
                  </div>
                  <span className="font-medium">{currency}{(item.quantity * item.unit_price).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                <span>{t("total")}</span>
                <span>{currency}{total.toLocaleString()}</span>
              </div>
            </div>

            {doc.content?.notes && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{t("notes")}</p>
                <p>{doc.content.notes}</p>
              </div>
            )}

            {doc.content?.terms && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{t("terms")}</p>
                <p>{doc.content.terms}</p>
              </div>
            )}

            <Separator />

            <div className="flex flex-wrap gap-3 justify-end">
              <Button variant="outline" onClick={downloadPDF} className="gap-2">
                <Download className="w-4 h-4" />
                {t("downloadPDF")}
              </Button>

              {docStatus !== "signed" && (
                <Button variant="outline" onClick={() => setShowSignModal(true)} className="gap-2">
                  <Signature className="w-4 h-4" />
                  {t("signDocument")}
                </Button>
              )}

              {doc.type === "invoice" && docStatus === "signed" && !paying && (
                <Button onClick={handlePay} className="gap-2" style={{ backgroundColor: accent }}>
                  <CreditCard className="w-4 h-4" />
                  {t("payNow")}
                </Button>
              )}
              {payError && (
                <p className="text-xs text-destructive w-full text-right">{t("payError")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {!hideBranding && (
          <p className="text-center text-xs text-muted-foreground">
            {t("secureLink")}
          </p>
        )}

        {/* Signature Modal */}
        {showSignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{t("signDocument")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("drawSignature")}</p>
                <div className="border-2 border-dashed border-border rounded-lg">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="w-full h-48 cursor-crosshair bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearSignature} className="flex-1">
                    {t("clear")}
                  </Button>
                  <Button onClick={handleSign} disabled={!signature || signing} className="flex-1 gap-2">
                    {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {t("confirmSignature")}
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => setShowSignModal(false)} className="w-full">
                  {t("cancel")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}