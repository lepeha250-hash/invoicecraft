"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Mail, Plus, Trash2, Loader2, Shield, User, Crown, ShieldCheck, Eye } from "lucide-react";
import { useState } from "react";

interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}

interface Member {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  profiles: { id: string; name: string; email: string; avatar_url: string | null } | null;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
}

interface TeamSettingsClientProps {
  locale: "en" | "ru";
  team: { id: string; name: string; slug: string; owner_id: string };
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    profiles: { id: string; name: string; email: string; avatar_url: string | null } | null;
  }>;
  invites: Array<{ id: string; email: string; role: string; expires_at: string }>;
}

export default function TeamSettingsClient({ locale, team, members, invites }: TeamSettingsClientProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const roleLabels = {
    owner: { label: t("owner"), icon: Crown, color: "bg-yellow-500" },
    admin: { label: t("admin"), icon: ShieldCheck, color: "bg-blue-500" },
    member: { label: t("member"), icon: User, color: "bg-green-500" },
    viewer: { label: t("viewer"), icon: Eye, color: "bg-gray-500" },
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, invitedBy: "current-user" }),
      });
      if (!res.ok) throw new Error("Invite failed");
      window.location.reload();
    } catch (e) {
      console.error("Invite error:", e);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string | null) => {
    if (!newRole) return;
    setUpdatingId(memberId);
    try {
      const res = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Update failed");
      window.location.reload();
    } catch (e) {
      console.error("Role update error:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this member?")) return;
    setDeletingId(memberId);
    try {
      const res = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Remove failed");
      window.location.reload();
    } catch (e) {
      console.error("Remove error:", e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t("teamSettings")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{team.name}</p>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4" />
                {t("members")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {members.map((member) => {
                  const profile = member.profiles;
                  const isOwner = member.role === "owner";
                  const roleInfo = roleLabels[member.role as keyof typeof roleLabels] || roleLabels.member;
                  const RoleIcon = roleInfo.icon;
                  return (
                    <Card key={member.id} className="border-border/50">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <RoleIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{profile?.name || "Unknown"}</h3>
                              <p className="text-sm text-muted-foreground">{profile?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">
                              <RoleIcon className="w-3.5 h-3.5 mr-1" />
                              {roleLabels[member.role as keyof typeof roleLabels]?.label || member.role}
                            </Badge>
                            {!isOwner && (
                              <>
                                <Select
                                  value={member.role}
                                  onValueChange={(v: string | null) => handleRoleChange(member.id, v || "")}
                                  disabled={updatingId === member.id}
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleRemove(member.id)}
                                  disabled={deletingId === member.id}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div>
                <Label className="mb-2 block">{t("inviteMember")}</Label>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="invite-email" className="sr-only">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member" | "viewer")}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t("admin")}</SelectItem>
                      <SelectItem value="member">{t("member")}</SelectItem>
                      <SelectItem value="viewer">{t("viewer")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="gap-2">
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {t("invite")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="w-4 h-4" />
                {t("pendingInvites")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noPendingInvites")}</p>
              ) : (
                <ul className="space-y-2">
                  {invites.map((invite) => (
                    <li key={invite.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-sm text-muted-foreground">{t("role")}: {invite.role}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t("expires")}: {new Date(invite.expires_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}