import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await request.json();

    if (!token || !userId) {
      return NextResponse.json({ error: "token and userId required" }, { status: 400 });
    }

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("team_invites")
      .select("*, teams(*)")
      .eq("id", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
    }

    const { error: memberError } = await supabaseAdmin
      .from("team_members")
      .insert({
        team_id: invite.team_id,
        user_id: userId,
        role: invite.role,
        accepted_at: new Date().toISOString(),
      });

    if (memberError) throw memberError;

    await supabaseAdmin
      .from("team_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}