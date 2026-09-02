import { Metadata } from "next";
import { notFound } from "next/navigation";
import RecurringClient from "./recurring-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/server-org";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "Recurring Billing — InvoiceCraft", ru: "Регулярные счета — InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

// Force dynamic rendering since data changes
export const dynamic = "force-dynamic";

export default async function RecurringPage({ params }: Props) {
  const { locale } = await params;
  const demoOrgId = await getActiveOrgId();

  const { data: recurring, error } = await supabaseAdmin
    .from("recurring_documents")
    .select("*")
    .eq("org_id", demoOrgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Recurring fetch error:", error);
    notFound();
  }

  return <RecurringClient locale={locale as "en" | "ru"} recurring={recurring ?? []} />;
}
