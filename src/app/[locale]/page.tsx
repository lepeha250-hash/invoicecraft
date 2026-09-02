"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Zap, Download, Globe, Check, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

export default function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">{tc("appName")}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">{tc("login")}</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">{tc("signup")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered document generation
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-base px-8 gap-2">
                  {t("hero.cta")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base px-8">
                {t("hero.ctaSecondary")}
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">{t("features.title")}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Zap, key: "ai" as const },
                { icon: FileText, key: "templates" as const },
                { icon: Download, key: "export" as const },
                { icon: Globe, key: "multilang" as const },
              ].map(({ icon: Icon, key }) => (
                <Card key={key} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">
                      {t(`features.${key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`features.${key}.desc`)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">{t("pricing.title")}</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {(["free", "pro", "business"] as const).map((plan) => (
                <Card
                  key={plan}
                  className={`border-border/50 ${plan === "pro" ? "border-primary shadow-lg scale-[1.02]" : ""}`}
                >
                  <CardContent className="pt-6">
                    {plan === "pro" && (
                      <Badge className="mb-3">Most Popular</Badge>
                    )}
                    <h3 className="font-semibold text-lg mb-1">
                      {t(`pricing.${plan}.name`)}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold">
                        {t(`pricing.${plan}.price`)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {t(`pricing.${plan}.period`)}
                      </span>
                    </div>
                    <ul className="space-y-2.5 mb-6">
                      {["features"].length > 0 &&
                        t.raw(`pricing.${plan}.features`).map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                    </ul>
                    <Link href="/auth/signup" className="block">
                      <Button
                        className="w-full"
                        variant={plan === "pro" ? "default" : "outline"}
                      >
                        {t(`pricing.${plan}.cta`)}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            {tc("appName")} &copy; 2026
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
