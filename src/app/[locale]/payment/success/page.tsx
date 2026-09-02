import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return [];
}

export default async function PaymentSuccess({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment" });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">{t("successTitle")}</h1>
        <p className="text-muted-foreground">{t("successDesc")}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}