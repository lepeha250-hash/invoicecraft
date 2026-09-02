import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, userId, plan, documentId, amount, currency, email } = body;

    // One-time payment for an invoice (portal)
    if (mode === "payment") {
      if (!documentId || !amount) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      let customerId: string | undefined;
      if (email) {
        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("stripe_customer_id")
          .eq("user_id", documentId)
          .maybeSingle();
        customerId = existing?.stripe_customer_id;

        if (!customerId) {
          const { data: users } = await supabaseAdmin
            .from("users")
            .select("stripe_customer_id")
            .eq("email", email)
            .maybeSingle();
          customerId = users?.stripe_customer_id;
        }

        if (!customerId) {
          const customer = await stripe.customers.create({
            email,
            name: email,
            metadata: { document_id: documentId },
          });
          customerId = customer.id;
        }
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: (currency || "usd").toLowerCase(),
              unit_amount: Math.round(amount * 100),
              product_data: { name: "Invoice payment" },
            },
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/canceled`,
        metadata: { document_id: documentId },
      });

      return NextResponse.json({ url: session.url });
    }

    // Existing subscription checkout
    if (!userId || !plan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const priceIds: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO!,
      business: process.env.STRIPE_PRICE_BUSINESS!,
    };

    const priceId = priceIds[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    let customerId = existing?.stripe_customer_id;

    if (!customerId) {
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("email, name")
        .eq("id", userId)
        .single();

      const customer = await stripe.customers.create({
        email: user?.email,
        name: user?.name,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: { user_id: userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
