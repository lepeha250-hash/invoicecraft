"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

interface InviteData {
  id: string;
  email: string;
  role: string;
  status: string;
  teams: {
    id: string;
    name: string;
    slug: string;
  };
}

interface TeamInviteClientProps {
  locale: "en" | "ru";
  invite: InviteData;
}

export default function TeamInviteClient({ locale, invite }: TeamInviteClientProps) {
  const t = useTranslations("team");
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleLabels = {
    en: { owner: "Owner", admin: "Admin", member: "Member", viewer: "Viewer" },
    ru: { owner: "Владелец", admin: "Админ", member: "Участник", viewer: "Наблюдатель" },
  };

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invite.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Accept failed");
      }
      setAccepted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (accepted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold">{t("inviteAccepted")}</h1>
              <p className="text-muted-foreground mt-2">{t("welcomeToTeam")}</p>
              <Button className="mt-6 w-full" onClick={() => router.replace(`/${locale}/dashboard`)}>
                {t("goToDashboard")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t("teamInvite")}</h1>
          <p className="text-muted-foreground mt-1">{t("inviteDescription")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold">{invite.teams.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("role")}: {roleLabels[locale as "en" | "ru"][invite.role as keyof typeof roleLabels.en] || invite.role}</p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button
            className="w-full gap-2"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {t("acceptInvite")}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {t("inviteExpires")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}