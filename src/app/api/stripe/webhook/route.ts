import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { completeDonation, failDonation } from "@/lib/donations";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = await getStripe();
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        await completeDonation({
          sessionId: session.id,
          amountTotal: session.amount_total,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        });
      }
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await failDonation(event.data.object.id);
      break;
  }

  return NextResponse.json({ received: true });
}
