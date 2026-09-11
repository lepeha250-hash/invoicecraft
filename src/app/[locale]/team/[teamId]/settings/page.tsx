import { Metadata } from "next";
import { notFound } from "next/navigation";
import TeamSettingsClient from "./team-settings-client";
import { supabaseAdmin } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ locale: string; teamId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles = { en: "Team Settings — InvoiceCraft", ru: "Настройки команды — InvoiceCraft" };
  return { title: titles[locale as "en" | "ru"] };
}

export async function generateStaticParams() {
  return [];
}

// Force dynamic - team data changes
export const dynamic = "force-dynamic";

export default async function TeamSettingsPage({ params }: Props) {
  const { teamId } = await params;

  const { data: team, error } = await supabaseAdmin
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (error || !team) {
    return notFound();
  }

  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select("*, profiles(*)")
    .eq("team_id", teamId);

  const { data: invites } = await supabaseAdmin
    .from("team_invites")
    .select("*")
    .eq("team_id", teamId)
    .eq("accepted_at", null)
    .gt("expires_at", new Date().toISOString());

  if (error) {
    return notFound();
  }

  return <TeamSettingsClient team={team} members={members ?? []} invites={invites ?? []} />;
}