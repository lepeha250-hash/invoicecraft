import { Metadata } from "next";
import { notFound } from "next/navigation";
import TeamInviteClient from "./team-invite-client";
import { supabaseAdmin } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ locale: string; token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "Join Team — InvoiceCraft", ru: "Присоединиться к команде — InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

export async function generateStaticParams() {
  return [];
}

// Force dynamic - invite tokens change
export const dynamic = "force-dynamic";

export default async function TeamInvitePage({ params }: Props) {
  const { locale, token } = await params;

  const { data: invite, error } = await supabaseAdmin
    .from("team_invites")
    .select("*, teams(*)")
    .eq("token", token)
    .single();

  if (error || !invite) {
    notFound();
  }

  if (new Date(invite.expires_at) < new Date()) {
    notFound();
  }

  if (invite.accepted_at) {
    notFound();
  }

  return <TeamInviteClient locale={locale as "en" | "ru"} invite={invite} />;
}