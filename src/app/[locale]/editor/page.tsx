import { Metadata } from "next";
import { notFound } from "next/navigation";
import EditorClient from "./editor-client";
import { supabaseAdmin } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "New Document — InvoiceCraft", ru: "Новый документ — InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ru" }];
}

export default async function EditorPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { id } = await searchParams;
  const localeTyped = locale as "en" | "ru";

  let document = null;
  if (id) {
    const { data } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) notFound();
    document = data;
  }

  return <EditorClient locale={localeTyped} initialDoc={document} />;
}