import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const SYSTEM_PROMPTS = {
  en: `You are an expert business document writer. Generate professional proposals, invoices, and acts.
Return ONLY valid JSON with this structure:
{
  "title": "Document title",
  "items": [
    {
      "id": "unique-id",
      "description": "Service description",
      "quantity": 1,
      "unit": "pc",
      "unit_price": 0
    }
  ],
  "notes": "Additional notes",
  "terms": "Terms and conditions"
}
Generate realistic pricing. Be specific with service descriptions. Add 3-7 line items.`,
  ru: `Ты expert по деловой документации. Генерируй профессиональные предложения, счета и акты.
Возвращай ТОЛЬКО валидный JSON со следующей структурой:
{
  "title": "Название документа",
  "items": [
    {
      "id": "уникальный-id",
      "description": "Описание услуги",
      "quantity": 1,
      "unit": "шт",
      "unit_price": 0
    }
  ],
  "notes": "Дополнительные примечания",
  "terms": "Условия и сроки"
}
Генерируй реалистичные цены. Будь конкретен с описаниями услуг. Добавь 3-7 позиций.`,
};

export async function POST(request: NextRequest) {
  try {
    const { brief, type, language = "en" } = await request.json();

    if (!brief) {
      return NextResponse.json({ error: "Brief is required" }, { status: 400 });
    }

    const typeLabels = {
      en: { proposal: "commercial proposal", invoice: "invoice", act: "act of completed work" },
      ru: { proposal: "коммерческое предложение", invoice: "счёт", act: "акт выполненных работ" },
    };

    const lang = language === "ru" ? "ru" : "en";
    const systemPrompt = SYSTEM_PROMPTS[lang];
    const typeLabel = typeLabels[lang][type as keyof typeof typeLabels.en] || "document";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Create a ${typeLabel} based on this brief: "${brief}". Generate realistic line items with pricing.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No content generated" }, { status: 500 });
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    const document = JSON.parse(jsonMatch[0]);
    return NextResponse.json(document);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
