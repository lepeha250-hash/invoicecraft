import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { data, error } = await supabaseAdmin
      .from("team_members")
      .select(`
        *,
        profiles (*)
      `)
      .eq("team_id", teamId);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("List members error:", error);
    return NextResponse.json({ error: "Failed to list members" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { email, role, invitedBy } = await request.json();

    if (!email || !role || !invitedBy) {
      return NextResponse.json({ error: "email, role, invitedBy required" }, { status: 400 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invite, error } = await supabaseAdmin
      .from("team_invites")
      .insert({
        team_id: teamId,
        email,
        role,
        invited_by: invitedBy,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/invite/${token}`;

    return NextResponse.json({ invite, inviteUrl });
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}