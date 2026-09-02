import { Metadata } from "next";
import { notFound } from "next/navigation";
import WebhooksClient from "./webhooks-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/server-org";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "Webhooks — InvoiceCraft", ru: "Вебхуки — InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

export const dynamic = "force-dynamic";

export default async function WebhooksPage({ params }: Props) {
  const { locale } = await params;
  const demoOrgId = await getActiveOrgId();

  const { data: webhooks, error } = await supabaseAdmin
    .from("webhooks")
    .select("*")
    .eq("org_id", demoOrgId)
    .order("created_at", { ascending: false });

  const { data: deliveries, error: dError } = await supabaseAdmin
    .from("webhook_deliveries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error || dError) {
    console.error("Webhooks page fetch error:", error, dError);
    notFound();
  }

  return (
    <WebhooksClient
      locale={locale as "en" | "ru"}
      webhooks={webhooks ?? []}
      deliveries={deliveries ?? []}
    />
  );
}