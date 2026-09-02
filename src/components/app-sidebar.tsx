"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText,
  LayoutDashboard,
  FilePlus,
  Layers,
  Settings,
  CreditCard,
  Repeat,
  BarChart3,
  MailCheck,
  KeyRound,
  Webhook,
  ScrollText,
  LogOut,
  Globe,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useLocale } from "next-intl";

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { key: "allDocuments", icon: FileText, href: "/documents" },
  { key: "newDocument", icon: FilePlus, href: "/editor" },
  { key: "myTemplates", icon: Layers, href: "/templates" },
  { key: "analytics", icon: BarChart3, href: "/analytics" },
  { key: "emailSequences", icon: MailCheck, href: "/email-sequences" },
  { key: "recurring", icon: Repeat, href: "/recurring" },
  { key: "apiPage", icon: KeyRound, href: "/api" },
  { key: "webhooksPage", icon: Webhook, href: "/webhooks" },
  { key: "auditLog", icon: ScrollText, href: "/audit-log" },
] as const;

const bottomItems = [
  { key: "companySettings", icon: Settings, href: "/settings" },
  { key: "subscription", icon: CreditCard, href: "/billing" },
] as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { resolvedTheme, setTheme } = useTheme();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    document.cookie = "invoicecraft_org=; Max-Age=0; path=/";
    router.push("/");
  };

  return (
    <aside className="w-64 border-r border-border/50 bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">{tc("appName")}</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.key} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                {t(item.key)}
              </Button>
            </Link>
          );
        })}

        <Separator className="my-3" />

        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.key} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                {t(item.key)}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md px-3 h-10 text-left text-sm hover:bg-accent focus:bg-accent outline-none transition-colors">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                U
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-left text-sm">User</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => switchLocale(locale === "en" ? "ru" : "en")}>
              <Globe className="w-4 h-4 mr-2" />
              {locale === "en" ? "Русский" : "English"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {resolvedTheme === "dark" ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {resolvedTheme === "dark" ? tc("themeLight") : tc("themeDark")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {tc("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
