import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import SettingsClient from "./settings-client";
import type { BillingSettings } from "@/lib/billing";
import { getActiveOrgId } from "@/lib/server-org";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "Company Settings — InvoiceCraft", ru: "Настройки компании — InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ru" }];
}

export default async function SettingsPage() {
  const orgId = await getActiveOrgId();
  if (!orgId) notFound();

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  const settings = (org?.settings || {}) as BillingSettings;

  return (
    <SettingsClient
      orgId={orgId}
      orgName={org?.name || ""}
      settings={settings}
    />
  );
}