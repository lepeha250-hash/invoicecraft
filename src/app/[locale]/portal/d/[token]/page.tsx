import { Metadata } from "next";
import { notFound } from "next/navigation";
import PortalClient from "./portal-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, type BillingSettings } from "@/lib/billing";

interface Props {
  params: Promise<{ locale: string; token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, token } = await params;

  let title = locale === "ru" ? "Портал документов — InvoiceCraft" : "Document Portal — InvoiceCraft";
  const { data: share } = await supabaseAdmin
    .from("document_shares")
    .select("documents(org_id)")
    .eq("token", token)
    .maybeSingle();
  const orgId = (share as { documents?: { org_id?: string } } | null)?.documents?.org_id;
  if (orgId) {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();
    const wl = (org?.settings as { whiteLabel?: { portal_name?: string } })?.whiteLabel;
    const brandName = (org?.settings as { brand?: { name?: string } })?.brand?.name;
    if (wl?.portal_name) title = wl.portal_name;
    else if (brandName) title = brandName;
  }
  return { title };
}

export async function generateStaticParams() {
  return [];
}

// Force dynamic - share tokens change
export const dynamic = "force-dynamic";

export default async function PortalPage({ params }: Props) {
  const { locale, token } = await params;

  const { data: share, error } = await supabaseAdmin
    .from("document_shares")
    .select("*, documents(*)")
    .eq("token", token)
    .single();

  if (error || !share) {
    notFound();
  }

  if (new Date(share.expires_at) < new Date()) {
    notFound();
  }

  // Load org settings for white-label / brand customization
  let settings: BillingSettings = DEFAULT_SETTINGS;
  const docOrgId = share.documents?.org_id;
  if (docOrgId) {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name, settings")
      .eq("id", docOrgId)
      .single();
    if (org) {
      settings = {
        ...DEFAULT_SETTINGS,
        ...(org.settings || {}),
        brand: { ...DEFAULT_SETTINGS.brand, ...(org.settings?.brand || {}), name: org.settings?.brand?.name || org.name },
        whiteLabel: { ...DEFAULT_SETTINGS.whiteLabel, ...(org.settings?.whiteLabel || {}) },
      };
    }
  }

  return (
    <PortalClient
      locale={locale as "en" | "ru"}
      share={share}
      settings={settings}
    />
  );
}