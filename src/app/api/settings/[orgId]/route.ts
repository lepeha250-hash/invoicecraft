import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { auditLog } from "@/lib/audit";

export interface BillingSettings {
  brand?: {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    logo_url?: string | null;
    accent_color?: string;
    footer_text?: string;
  };
  numbering?: {
    invoice_prefix?: string;
    proposal_prefix?: string;
    act_prefix?: string;
    padding?: number;
    include_year?: boolean;
    start_at?: number;
  };
  tax?: {
    mode?: "none" | "vat" | "nds" | "gst";
    rate?: number;
    label?: string;
    tax_included?: boolean;
  };
  whiteLabel?: {
    active?: boolean;
    portal_name?: string;
    hide_branding?: boolean;
    custom_domain?: string;
  };
  theme?: "light" | "dark" | "system";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const settings = (data.settings || {}) as Record<"brand" | "numbering" | "tax" | "whiteLabel", unknown> & BillingSettings;
    return NextResponse.json({
      brand: settings.brand || {},
      numbering: settings.numbering || {
        invoice_prefix: "INV",
        proposal_prefix: "PRO",
        act_prefix: "ACT",
        padding: 3,
        include_year: true,
        start_at: 1,
      },
      tax: settings.tax || { mode: "none", rate: 0, tax_included: false },
      whiteLabel: settings.whiteLabel || { active: false, portal_name: "", hide_branding: false, custom_domain: "" },
      theme: settings.theme || "system",
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const body = (await request.json()) as Partial<BillingSettings>;

    // Read current settings and merge
    const { data: current, error: readError } = await supabaseAdmin
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();

    if (readError) throw readError;

    const mergedSettings = {
      ...((current?.settings as Record<string, unknown>) || {}),
      ...(body.brand && { brand: body.brand }),
      ...(body.numbering && { numbering: body.numbering }),
      ...(body.tax && { tax: body.tax }),
      ...(body.whiteLabel && { whiteLabel: body.whiteLabel }),
      ...(body.theme && { theme: body.theme }),
    };

    const { data, error } = await supabaseAdmin
      .from("organizations")
      .update({ settings: mergedSettings })
      .eq("id", orgId)
      .select("settings")
      .single();

    if (error) throw error;
    auditLog({
      org_id: orgId,
      action: "settings.updated",
      entity_type: "organization",
      entity_id: orgId,
      details: { updated_fields: Object.keys(body).filter(Boolean) },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}