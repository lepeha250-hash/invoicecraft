import { Metadata } from "next";
import { notFound } from "next/navigation";
import SequencesClient from "./sequences-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/server-org";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "Email Sequences вЂ” InvoiceCraft", ru: "Email-С†РµРїРѕС‡РєРё вЂ” InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

// Force dynamic rendering since data changes
export const dynamic = "force-dynamic";

export default async function SequencesPage() {
  const demoOrgId = await getActiveOrgId();
  if (!demoOrgId) notFound();

  const { data: sequences, error } = await supabaseAdmin
    .from("email_sequences")
    .select("*")
    .eq("org_id", demoOrgId)
    .order("created_at", { ascending: false });

  const { data: logs, error: logError } = await supabaseAdmin
    .from("email_sequence_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || logError) {
    console.error("Sequences fetch error:", error, logError);
    notFound();
  }

  return (
    <SequencesClient
      sequences={sequences ?? []}
      logs={logs ?? []}
    />
  );
}