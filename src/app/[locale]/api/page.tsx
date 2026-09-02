import { Metadata } from "next";
import { notFound } from "next/navigation";
import ApiClient from "./api-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/server-org";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "API Access — InvoiceCraft", ru: "API-доступ — InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

export const dynamic = "force-dynamic";

export default async function ApiPage({ params }: Props) {
  const { locale } = await params;
  const demoOrgId = await getActiveOrgId();

  const { data: keys, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, revoked")
    .eq("org_id", demoOrgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("API keys fetch error:", error);
    notFound();
  }

  return <ApiClient locale={locale as "en" | "ru"} keys={keys ?? []} />;
}