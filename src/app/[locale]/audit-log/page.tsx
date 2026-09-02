import { Metadata } from "next";
import { notFound } from "next/navigation";
import AuditLogClient from "./audit-log-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/server-org";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "Audit Log — InvoiceCraft", ru: "Журнал аудита — InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

export const dynamic = "force-dynamic";

export default async function AuditLogPage({ params }: Props) {
  const { locale } = await params;
  const demoOrgId = await getActiveOrgId();

  const { data: entries, error } = await supabaseAdmin
    .from("audit_log")
    .select("*")
    .eq("org_id", demoOrgId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Audit log fetch error:", error);
    notFound();
  }

  return <AuditLogClient locale={locale as "en" | "ru"} entries={entries ?? []} />;
}