import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const ORG_COOKIE = "invoicecraft_org";
const DEMO_ORG = "ecb399e5-bf2f-487a-b2e0-f3104cfd2b30";

// Public pages (locale-prefixed): landing, auth, client portal, payment, team invites
const PUBLIC_LANDING = /^\/(en|ru)\/?$/;
const PUBLIC_PAGE = /^\/(en|ru)\/(auth|portal|payment|team\/invite)(\/|$)/;

// Public API: auth callbacks, portal (token-based), v1 (bearer key), webhooks, cron
const PUBLIC_API = /^\/api\/(auth|portal|v1)\//;
const PUBLIC_API_EXACT = new Set([
  "/api/stripe/webhook",
  "/api/recurring/run",
  "/api/sequences/run",
]);

function isPublicApi(path: string): boolean {
  return PUBLIC_API.test(path) || PUBLIC_API_EXACT.has(path);
}

function localeOf(pathname: string): "en" | "ru" {
  return pathname.startsWith("/ru") ? "ru" : "en";
}

async function getUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function ensureOrgCookie(
  response: NextResponse,
  request: NextRequest,
  userId: string
) {
  const cookieOrg = request.cookies.get(ORG_COOKIE)?.value;
  if (cookieOrg && cookieOrg !== DEMO_ORG) return;

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let org: { id: string; name?: string } | null = null;
    const { data: found } = await admin
      .from("organizations")
      .select("id, name")
      .eq("user_id", userId)
      .maybeSingle();
    org = found;

    if (!org) {
      const { data: profile } = await admin
        .from("profiles")
        .select("email, name")
        .eq("id", userId)
        .maybeSingle();
      const name =
        profile?.name ||
        (profile?.email ? profile.email.split("@")[0] : "My Company");
      const { data: created } = await admin
        .from("organizations")
        .insert({ user_id: userId, name, settings: {} })
        .select("id, name")
        .single();
      org = created;
    }

    if (org?.id && org.id !== cookieOrg) {
      response.cookies.set(ORG_COOKIE, org.id, { path: "/", sameSite: "lax" });
    }
  } catch (error) {
    console.error("middleware org provisioning failed:", error);
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // ----- API routes -----
  if (isApi) {
    if (isPublicApi(pathname)) return NextResponse.next();

    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ----- Page routes: let next-intl handle locale first -----
  const intlResponse = intlMiddleware(request);

  // next-intl issued a locale redirect (e.g. /billing → /en/billing): honor it
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  if (PUBLIC_LANDING.test(pathname) || PUBLIC_PAGE.test(pathname)) {
    return intlResponse;
  }

  const user = await getUser(request);

  if (!user) {
    const loginUrl = new URL(`/${localeOf(pathname)}/auth/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    intlResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  await ensureOrgCookie(intlResponse, request, user.id);
  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};