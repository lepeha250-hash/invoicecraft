import { Metadata } from "next";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import SettingsClient from "./settings-client";
import type { BillingSettings } from "@/lib/billing";

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

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;

  const demoOrgId = "ecb399e5-bf2f-487a-b2e0-f3104cfd2b30";
  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get("invoicecraft_org")?.value;

  const orgId = cookieOrg && cookieOrg !== "9fca18f6-9db8-4ad9-957e-9ec5821e163d"
    ? cookieOrg
    : demoOrgId;

  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  const settings = (org?.settings || {}) as BillingSettings;

  return (
    <SettingsClient
      locale={locale as "en" | "ru"}
      orgId={orgId}
      orgName={org?.name || ""}
      settings={settings}
    />
  );
}