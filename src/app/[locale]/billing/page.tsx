"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, ArrowUpRight, Loader2, Check } from "lucide-react";
import { useEffect, useState } from "react";

type Plan = "free" | "pro" | "business";

export default function BillingPage() {
  const t = useTranslations("billing");
  const tc = useTranslations("common");

  const plans: Plan[] = ["free", "pro", "business"];
  const [currentPlan, setCurrentPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<Plan | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/subscription");
        const json = await res.json();
        if (json.subscription?.plan) setCurrentPlan(json.subscription.plan);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activate = async (plan: Plan) => {
    setActivating(plan);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.subscription?.plan) setCurrentPlan(json.subscription.plan);
    } catch (e) {
      console.error(e);
    } finally {
      setActivating(null);
    }
  };

  const isFree = currentPlan === "free";

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t("currentPlan")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("trialHint", { plan: currentPlan })}
            </p>
          </div>

          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={currentPlan === "free" ? "secondary" : "default"} className="capitalize mb-2">
                    {currentPlan}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {t("documentsUsed", { used: "0", limit: "3" })}
                  </p>
                </div>
                {!loading && isFree && (
                  <Button className="gap-2" onClick={() => activate("pro")} disabled={activating === "pro"}>
                    {activating === "pro" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {t("activateProTrial")}
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                )}
                {!loading && !isFree && (
                  <Button variant="ghost" size="sm" onClick={() => activate("free")} disabled={activating === "free"}>
                    {t("cancelPlan")}
                  </Button>
                )}
              </div>
              {isFree && (
                <p className="text-xs text-muted-foreground">{t("freeHint")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4" />
                {t("paymentMethod")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("noPaymentMethod")}</p>
            </CardContent>
          </Card>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-4">{t("availablePlans")}</h2>
            <div className="grid gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan}
                  className={`border-border/50 ${plan === currentPlan ? "border-primary/50 bg-muted/30" : ""}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium capitalize">{plan}</span>
                        {plan === currentPlan && (
                          <Badge variant="outline" className="gap-1">
                            <Check className="w-3 h-3" />
                            {t("current")}
                          </Badge>
                        )}
                      </div>
                      {plan !== currentPlan && (
                        <Button
                          variant={plan === "free" ? "ghost" : "default"}
                          size="sm"
                          onClick={() => activate(plan)}
                          disabled={activating === plan}
                        >
                          {activating === plan ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {plan === "free" ? t("cancelPlan") : t("upgrade")}
                        </Button>
                      )}
                      {plan === currentPlan && !loading && (
                        <span className="text-sm text-muted-foreground">{t("active")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
