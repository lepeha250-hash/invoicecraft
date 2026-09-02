import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { XCircle } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return [];
}

export default async function PaymentCanceled({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment" });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <XCircle className="w-16 h-16 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">{t("canceledTitle")}</h1>
        <p className="text-muted-foreground">{t("canceledDesc")}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-muted/50"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}