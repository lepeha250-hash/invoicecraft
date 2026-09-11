"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Palette, Hash, Calculator, Globe, Sun, Check, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import type { BillingSettings } from "@/lib/billing";
import { DEFAULT_SETTINGS } from "@/lib/billing";

interface SettingsClientProps {
  orgId: string;
  orgName: string;
  settings: BillingSettings;
}

export default function SettingsClient({ orgId, orgName, settings }: SettingsClientProps) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { setTheme: applyTheme } = useTheme();

  const initial = {
    ...DEFAULT_SETTINGS,
    ...settings,
    brand: { ...DEFAULT_SETTINGS.brand, ...settings.brand, name: settings.brand?.name || orgName },
    numbering: { ...DEFAULT_SETTINGS.numbering, ...settings.numbering },
    tax: { ...DEFAULT_SETTINGS.tax, ...settings.tax },
    whiteLabel: { ...DEFAULT_SETTINGS.whiteLabel, ...settings.whiteLabel },
  };

  const [brand, setBrand] = useState(initial.brand!);
  const [numbering, setNumbering] = useState(initial.numbering!);
  const [tax, setTax] = useState(initial.tax!);
  const [whiteLabel, setWhiteLabel] = useState(initial.whiteLabel!);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(initial.theme || "system");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/${orgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, numbering, tax, whiteLabel, theme }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Save settings error:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value);
    applyTheme(value);
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("company")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("tagline")}</p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saved ? t("saved") : tc("save")}
            </Button>
          </div>

          <Tabs defaultValue="brand">
            <TabsList>
              <TabsTrigger value="brand" className="gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {t("brandTab")}
              </TabsTrigger>
              <TabsTrigger value="numbering" className="gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                {t("numberingTab")}
              </TabsTrigger>
              <TabsTrigger value="tax" className="gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                {t("taxTab")}
              </TabsTrigger>
              <TabsTrigger value="whiteLabel" className="gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {t("whiteLabelTab")}
              </TabsTrigger>
              <TabsTrigger value="theme" className="gap-1.5">
                <Sun className="w-3.5 h-3.5" />
                {t("themeTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="brand" className="space-y-4 mt-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Palette className="w-4 h-4" />
                    {t("brandTab")}
                  </CardTitle>
                  <CardDescription>{t("brandDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("companyName")}</Label>
                    <Input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("companyAddress")}</Label>
                    <Input value={brand.address} onChange={(e) => setBrand({ ...brand, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("companyEmail")}</Label>
                      <Input type="email" value={brand.email} onChange={(e) => setBrand({ ...brand, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("companyPhone")}</Label>
                      <Input value={brand.phone} onChange={(e) => setBrand({ ...brand, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("companyWebsite")}</Label>
                    <Input value={brand.website} onChange={(e) => setBrand({ ...brand, website: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("accentColor")}</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="w-16 h-10 p-1 cursor-pointer"
                        value={brand.accent_color}
                        onChange={(e) => setBrand({ ...brand, accent_color: e.target.value })}
                      />
                      <Input
                        value={brand.accent_color}
                        onChange={(e) => setBrand({ ...brand, accent_color: e.target.value })}
                        className="w-36 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("logo")}</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t("uploadLogo")}</p>
                      {brand.logo_url && (
                        <p className="text-xs text-primary mt-2 truncate">{brand.logo_url}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="numbering" className="space-y-4 mt-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Hash className="w-4 h-4" />
                    {t("numberingTab")}
                  </CardTitle>
                  <CardDescription>{t("numberingDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t("invoicePrefix")}</Label>
                      <Input value={numbering.invoice_prefix} onChange={(e) => setNumbering({ ...numbering, invoice_prefix: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("proposalPrefix")}</Label>
                      <Input value={numbering.proposal_prefix} onChange={(e) => setNumbering({ ...numbering, proposal_prefix: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("actPrefix")}</Label>
                      <Input value={numbering.act_prefix} onChange={(e) => setNumbering({ ...numbering, act_prefix: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t("padding")}</Label>
                      <Input
                        type="number"
                        min={2}
                        max={6}
                        value={numbering.padding}
                        onChange={(e) => setNumbering({ ...numbering, padding: parseInt(e.target.value) || 3 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("startAt")}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={numbering.start_at}
                        onChange={(e) => setNumbering({ ...numbering, start_at: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("includeYear")}</Label>
                      <Select
                        value={numbering.include_year ? "yes" : "no"}
                        onValueChange={(v) => setNumbering({ ...numbering, include_year: v === "yes" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">{tc("yes")}</SelectItem>
                          <SelectItem value="no">{tc("no")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    {t("preview")}:{" "}
                    <span className="font-mono text-foreground">
                      {numbering.invoice_prefix}-{numbering.include_year ? `${new Date().getFullYear()}-` : ""}
                      {String((numbering.start_at || 1) + 3).padStart(numbering.padding || 3, "0")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tax" className="space-y-4 mt-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calculator className="w-4 h-4" />
                    {t("taxTab")}
                  </CardTitle>
                  <CardDescription>{t("taxDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("taxMode")}</Label>
                    <Select value={tax.mode} onValueChange={(v) => setTax({ ...tax, mode: v as typeof tax.mode })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("taxNone")}</SelectItem>
                        <SelectItem value="vat">VAT</SelectItem>
                        <SelectItem value="nds">НДС</SelectItem>
                        <SelectItem value="gst">GST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {tax.mode !== "none" && (
                    <>
                      <div className="space-y-2">
                        <Label>{t("taxRate")} (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={tax.rate}
                          onChange={(e) => setTax({ ...tax, rate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("taxIncluded")}</Label>
                        <Select
                          value={tax.tax_included ? "yes" : "no"}
                          onValueChange={(v) => setTax({ ...tax, tax_included: v === "yes" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">{tc("yes")}</SelectItem>
                            <SelectItem value="no">{tc("no")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whiteLabel" className="space-y-4 mt-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="w-4 h-4" />
                    {t("whiteLabelTab")}
                  </CardTitle>
                  <CardDescription>{t("whiteLabelDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("whiteLabelActive")}</Label>
                    <Select
                      value={whiteLabel.active ? "yes" : "no"}
                      onValueChange={(v) => setWhiteLabel({ ...whiteLabel, active: v === "yes" })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">{tc("no")}</SelectItem>
                        <SelectItem value="yes">{tc("yes")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {whiteLabel.active && (
                    <>
                      <div className="space-y-2">
                        <Label>{t("portalName")}</Label>
                        <Input
                          placeholder="e.g. Acme Portal"
                          value={whiteLabel.portal_name}
                          onChange={(e) => setWhiteLabel({ ...whiteLabel, portal_name: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">{t("portalNameHint")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("hideBranding")}</Label>
                        <Select
                          value={whiteLabel.hide_branding ? "yes" : "no"}
                          onValueChange={(v) => setWhiteLabel({ ...whiteLabel, hide_branding: v === "yes" })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">{tc("no")}</SelectItem>
                            <SelectItem value="yes">{tc("yes")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{t("hideBrandingHint")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("customDomain")}</Label>
                        <Input
                          placeholder="e.g. portal.acmestudio.com"
                          value={whiteLabel.custom_domain}
                          onChange={(e) => setWhiteLabel({ ...whiteLabel, custom_domain: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">{t("customDomainHint")}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="theme" className="space-y-4 mt-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sun className="w-4 h-4" />
                    {t("themeTab")}
                  </CardTitle>
                  <CardDescription>{t("themeDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("themeMode")}</Label>
                    <Select value={theme} onValueChange={(v) => handleThemeChange(v as "light" | "dark" | "system")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t("themeLight")}</SelectItem>
                        <SelectItem value="dark">{t("themeDark")}</SelectItem>
                        <SelectItem value="system">{t("themeSystem")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t("themeHint")}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}