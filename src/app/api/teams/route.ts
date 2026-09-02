import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const { data: memberships, error } = await supabaseAdmin
      .from("team_members")
      .select(`
        *,
        teams (*)
      `)
      .eq("user_id", userId);

    if (error) throw error;
    return NextResponse.json(memberships);
  } catch (error) {
    console.error("List teams error:", error);
    return NextResponse.json({ error: "Failed to list teams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, userId } = await request.json();

    if (!name || !userId) {
      return NextResponse.json({ error: "name and userId required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + randomBytes(4).toString("hex");

    const { data: team, error } = await supabaseAdmin
      .from("teams")
      .insert({ name, slug, owner_id: userId })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from("team_members")
      .insert({ team_id: team.id, user_id: userId, role: "owner", accepted_at: new Date().toISOString() });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}