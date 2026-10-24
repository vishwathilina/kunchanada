import "server-only";
import type Stripe from "stripe";

let client: Stripe | null = null;

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Loaded on demand so `randomBytes` inside the Stripe SDK does not run during prerender. */
export async function getStripe(): Promise<Stripe> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) {
    const { connection } = await import("next/server");
    await connection();
    const { default: StripeSdk } = await import("stripe");
    client = new StripeSdk(key, { appInfo: { name: "Kunchanada" } });
  }
  return client;
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
