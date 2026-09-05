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
type Interval = "month" | "quarter" | "semiannual" | "year";
type PaidPlan = Exclude<Plan, "free">;

const INTERVALS: Interval[] = ["month", "quarter", "semiannual", "year"];

const PRICES: Record<PaidPlan, Record<Interval, number>> = {
  pro: { month: 29, quarter: 79, semiannual: 149, year: 279 },
  business: { month: 99, quarter: 259, semiannual: 499, year: 949 },
};

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, business: 2 };

interface SubscriptionData {
  plan: Plan;
  billing_interval?: Interval;
  current_period_end?: string | null;
}

export default function BillingPage() {
  const t = useTranslations("billing");
  const [locale, setLocale] = useState<"en" | "ru">("en");

  const plans: Plan[] = ["free", "pro", "business"];
  const [currentPlan, setCurrentPlan] = useState<Plan>("free");
  const [currentInterval, setCurrentInterval] = useState<Interval>("month");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<Record<PaidPlan, Interval>>({
    pro: "month",
    business: "month",
  });
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocale(document.documentElement.lang === "ru" ? "ru" : "en");
    (async () => {
      try {
        const res = await fetch("/api/subscription");
        const json = await res.json();
        if (json.subscription) {
          const sub: SubscriptionData = json.subscription;
          setCurrentPlan(sub.plan);
          if (sub.billing_interval) setCurrentInterval(sub.billing_interval);
          if (sub.current_period_end) setCurrentPeriodEnd(sub.current_period_end);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activate = async (plan: Plan, interval?: Interval) => {
    setActivating(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      if (json.subscription) {
        const sub: SubscriptionData = json.subscription;
        setCurrentPlan(sub.plan);
        if (sub.billing_interval) setCurrentInterval(sub.billing_interval);
        if (sub.current_period_end) setCurrentPeriodEnd(sub.current_period_end);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to update subscription");
    } finally {
      setActivating(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso));
    } catch {
      return new Date(iso).toLocaleDateString();
    }
  };

  const priceOf = (plan: Plan, interval: Interval) => {
    if (plan === "free") return 0;
    return PRICES[plan][interval];
  };

  const formatPrice = (plan: Plan, interval: Interval) => {
    if (plan === "free") return `$${priceOf(plan, interval)}`;
    const value = priceOf(plan, interval);
    return `$${value} / ${t(`interval.${interval}`).toLowerCase()}`;
  };

  const currentPlanPaid = currentPlan !== "free";

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

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={currentPlanPaid ? "default" : "secondary"} className="capitalize mb-2">
                    {currentPlan}
                  </Badge>
                  {currentPlanPaid ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {t("currentPrice", { price: formatPrice(currentPlan, currentInterval) })}
                      </p>
                      {currentPeriodEnd && (
                        <p className="text-sm text-muted-foreground">
                          {t("nextBilling", { date: formatDate(currentPeriodEnd) })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("documentsUsed", { used: "0", limit: "3" })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!loading && !currentPlanPaid && (
                    <Button className="gap-2" onClick={() => activate("pro", "month")} disabled={activating}>
                      {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {t("activateProTrial")}
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              {!currentPlanPaid && <p className="text-xs text-muted-foreground">{t("freeHint")}</p>}
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
              {plans.map((plan) => {
                const isCurrent = plan === currentPlan;
                const isPaid = plan !== "free";
                const upgradable = !isCurrent && PLAN_RANK[plan] > PLAN_RANK[currentPlan];
                const interval = isPaid ? selectedInterval[plan as PaidPlan] : "month";
                return (
                  <Card
                    key={plan}
                    className={`border-border/50 ${isCurrent ? "border-primary/50 bg-muted/30" : ""}`}
                  >
                    <CardContent className="py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium capitalize">{plan}</span>
                          {isCurrent && (
                            <Badge variant="outline" className="gap-1">
                              <Check className="w-3 h-3" />
                              {t("current")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-semibold leading-none whitespace-nowrap">
                              {formatPrice(plan, interval)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[220px] truncate">
                              {t(`planDescription.${plan}`)}
                            </p>
                          </div>
                          {upgradable && isPaid && (
                            <Button
                              onClick={() => activate(plan, selectedInterval[plan as PaidPlan])}
                              disabled={activating}
                              size="sm"
                              className="shrink-0"
                            >
                              {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                              {t("upgrade")}
                            </Button>
                          )}
                          {isCurrent && !loading && <span className="text-sm text-muted-foreground">{t("active")}</span>}
                        </div>
                      </div>

                      {isPaid && upgradable && (
                        <div className="flex flex-wrap items-center gap-2">
                          {INTERVALS.map((iv) => (
                            <button
                              key={iv}
                              type="button"
                              onClick={() =>
                                setSelectedInterval((prev) => ({ ...prev, [plan as PaidPlan]: iv }))
                              }
                              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                                interval === iv
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
                              }`}
                            >
                              ${priceOf(plan, iv)} · {t(`interval.${iv}`)}
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}