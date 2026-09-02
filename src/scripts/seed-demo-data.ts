// Seed script: creates realistic demo documents for the demo org
// Run: npx tsx src/scripts/seed-demo-data.ts
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ORG_ID = "ecb399e5-bf2f-487a-b2e0-f3104cfd2b30";

interface SeedDoc {
  type: "proposal" | "invoice" | "act";
  status: "draft" | "sent" | "paid" | "archived";
  client: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
}

const docs: SeedDoc[] = [
  // ---- 2026, several months ago: March, April ----
  { type: "proposal", status: "sent", client: "Nordwind Group", amount: 1200, date: "2026-03-05", description: "Стратегия цифровой трансформации" },
  { type: "invoice", status: "paid", client: "Nordwind Group", amount: 2400, date: "2026-03-18", description: "Разработка платформы (этап 1)" },
  { type: "act", status: "paid", client: "Nordwind Group", amount: 2400, date: "2026-04-02", description: "Акт выполненных работ" },
  { type: "proposal", status: "paid", client: "Zeleny Dom", amount: 850, date: "2026-03-22", description: "Логотип и фирменный стиль" },
  { type: "invoice", status: "paid", client: "Zeleny Dom", amount: 850, date: "2026-04-10", description: "Дизайн-пакет" },
  { type: "proposal", status: "draft", client: "TechNova", amount: 3100, date: "2026-03-28", description: "MVP мобильного приложения" },
  // ---- May ----
  { type: "invoice", status: "paid", client: "Zeleny Dom", amount: 950, date: "2026-05-05", description: "Соцсети и контент (месяц 2)" },
  { type: "proposal", status: "paid", client: "Atlas Realty", amount: 1700, date: "2026-05-12", description: "Корпоративный сайт" },
  { type: "invoice", status: "paid", client: "Atlas Realty", amount: 1700, date: "2026-05-20", description: "Сайт: дизайн и вёрстка" },
  { type: "act", status: "paid", client: "Atlas Realty", amount: 1700, date: "2026-05-28", description: "Акт: сайт сдан" },
  // ---- June ----
  { type: "invoice", status: "paid", client: "Nordwind Group", amount: 3600, date: "2026-06-03", description: "Платформа (этап 2)" },
  { type: "proposal", status: "sent", client: "Vega Studio", amount: 1300, date: "2026-06-10", description: "Брендинг кинофестиваля" },
  { type: "invoice", status: "sent", client: "TechNova", amount: 1800, date: "2026-06-18", description: "Аудит и аналитика (счёт)" },
  { type: "proposal", status: "paid", client: "Cafe Mokka", amount: 640, date: "2026-06-22", description: "Меню и упаковка" },
  // ---- July ----
  { type: "invoice", status: "paid", client: "Cafe Mokka", amount: 640, date: "2026-07-02", description: "Полиграфия (счёт)" },
  { type: "invoice", status: "paid", client: "Atlas Realty", amount: 2100, date: "2026-07-08", description: "Поддержка сайта (месяц)" },
  { type: "act", status: "paid", client: "Nordwind Group", amount: 3600, date: "2026-07-15", description: "Акт: этап 2 завершён" },
  { type: "proposal", status: "sent", client: "GlobalTrade", amount: 2400, date: "2026-07-20", description: "B2B портал" },
  // ---- August (current month) ----
  { type: "invoice", status: "paid", client: "GlobalTrade", amount: 1850, date: "2026-08-02", description: "Прототип портала" },
  { type: "proposal", status: "sent", client: "Nordwind Group", amount: 2800, date: "2026-08-05", description: "Годовой ретейнер" },
  { type: "invoice", status: "paid", client: "TechNova", amount: 2200, date: "2026-08-11", description: "Мобильное приложение (счёт)" },
  { type: "invoice", status: "sent", client: "Vega Studio", amount: 1300, date: "2026-08-18", description: "Брендинг (счёт)" },
  { type: "invoice", status: "draft", client: "Zeleny Dom", amount: 980, date: "2026-08-22", description: "Месяц 5 (счёт)" },
  { type: "act", status: "paid", client: "TechNova", amount: 2200, date: "2026-08-26", description: "Акт: приложение сдано" },
];

async function main() {
  const { count, error: countError } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ORG_ID);

  if (countError) throw countError;

  console.log("Existing docs for org:", count);

  // Only seed if empty (avoid duplicates)
  if (count && count > 0) {
    console.log("Org already has documents - skipping seed. Delete them first to reseed.");
    return;
  }

  for (const d of docs) {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        org_id: ORG_ID,
        type: d.type,
        title: `${d.description} — ${d.client}`,
        content: {
          header: {
            company_name: "Acme Solutions",
            company_address: "123 Main St, Berlin",
            client_name: d.client,
            client_address: "Berlin, Germany",
            number: `${d.type === "invoice" ? "INV" : d.type === "proposal" ? "PRO" : "ACT"}-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
            date: d.date,
          },
          items: [
            {
              id: "seed-1",
              description: d.description,
              quantity: 1,
              unit: "project",
              unit_price: d.amount,
              total: d.amount,
            },
          ],
          notes: "Thank you for your business!",
          terms: "Payment within 14 days.",
        },
        status: d.status,
        total: d.amount,
        currency: "USD",
        created_at: `${d.date}T10:00:00.000Z`,
        updated_at: `${d.date}T10:00:00.000Z`,
      })
      .select("id, title, status, total, created_at");

    if (error) {
      console.error("Error seeding:", error.message);
    } else {
      console.log(`Seeded: ${data?.[0]?.title} (${data?.[0]?.status}) ${data?.[0]?.total}`);
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});