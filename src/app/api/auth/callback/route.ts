import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/server";
import { routing } from "@/lib/i18n/routing";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  const locale = searchParams.get("locale") || routing.defaultLocale;

  if (code) {
    const cookieStore = request.cookies;
    const response = NextResponse.redirect(`${origin}/${locale}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              response.cookies.set(name, value)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("AUTH_CALLBACK code=", code ? code.slice(0, 8) + "..." : "none", "error=", error?.message, "hasSession=", !!data.session);
    if (!error && data.session) {
      const userId = data.session.user.id;
      const orgId = await ensureOrg(userId, data.session.user.email);
      if (orgId) response.cookies.set("invoicecraft_org", orgId, { path: "/", sameSite: "lax" });
    }
    return response;
  }

  return NextResponse.redirect(`${origin}/${locale}/auth/login`);
}

async function ensureOrg(userId: string, email?: string | null): Promise<string | null> {
  const { data: existing } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing.id;

  const name = email ? email.split("@")[0] : "My Company";
  const { data: created, error } = await supabaseAdmin
    .from("organizations")
    .insert({ user_id: userId, name, settings: {} })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}
