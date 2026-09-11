import { Metadata } from "next";
import { notFound } from "next/navigation";
import DocumentsClient from "./documents-client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/server-org";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "Documents вЂ” InvoiceCraft", ru: "Р”РѕРєСѓРјРµРЅС‚С‹ вЂ” InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ru" }];
}

export default async function DocumentsPage({ searchParams }: Props) {
  const { search, page = "1" } = await searchParams;

  const demoOrgId = await getActiveOrgId();
  if (!demoOrgId) notFound();

  const { data: documents, error } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("org_id", demoOrgId)
    .order("created_at", { ascending: false })
    .range((parseInt(page) - 1) * 20, parseInt(page) * 20 - 1);

  if (error) {
    console.error("Documents fetch error:", error);
    notFound();
  }

  return <DocumentsClient documents={documents ?? []} search={search ?? ""} />;
}