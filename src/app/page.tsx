import { redirect } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";

export default function RootPage() {
  redirect({ href: "/dashboard", locale: routing.defaultLocale });
}
