"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SigninRedirect() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) {
          router.replace(`/${locale}/auth/login`);
          return;
        }
        const res = await fetch("/api/auth/org-provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
          credentials: "include",
        });
        if (!res.ok) {
          setState("error");
          setErrorMsg(t("authError"));
          return;
        }
        setState("ok");
        setTimeout(() => router.replace(`/${locale}/dashboard`), 600);
      } catch (e) {
        console.error(e);
        setState("error");
        setErrorMsg(t("authError"));
      }
    })();
  }, [locale, router, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium">{t("signinRedirectTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("signinRedirectSubtitle")}</p>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-500" />
            <p className="text-lg font-medium">{t("signinRedirectDone")}</p>
          </>
        )}
        {state === "error" && (
          <>
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
            <p className="text-lg font-medium">{t("signinRedirectError")}</p>
            {errorMsg && <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>}
            <Button className="mt-4" onClick={() => router.replace(`/${locale}/auth/login`)}>
              {t("login")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}