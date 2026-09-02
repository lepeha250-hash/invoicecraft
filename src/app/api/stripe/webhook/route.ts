import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const handleSubscriptionEvent = async (data: Stripe.Subscription) => {
    const customerId =
      data.customer && typeof data.customer === "string"
        ? data.customer
        : undefined;

    if (!customerId) return;

    const plan =
      data.items?.data?.[0]?.price?.metadata?.plan || "pro";

    const periodEnd =
      data.items?.data?.[0]?.current_period_end != null
        ? new Date(data.items.data[0].current_period_end * 1000).toISOString()
        : new Date().toISOString();

    await supabaseAdmin.from("subscriptions").upsert({
      user_id: data.metadata?.user_id || customerId,
      stripe_customer_id: customerId,
      stripe_subscription_id: data.id,
      plan,
      status: data.status,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    });
  };

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created":
      await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      const data = event.data.object as Stripe.Subscription;
      await supabaseAdmin
        .from("subscriptions")
        .update({ plan: "free", status: "canceled" })
        .eq("stripe_subscription_id", data.id);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
