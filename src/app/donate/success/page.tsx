import { eq } from "drizzle-orm";
import { CircleCheckBig, Clock } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { completeDonation } from "@/lib/donations";
import { formatMoney } from "@/lib/format";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = { title: "Thank you" };

/**
 * Reconciles with Stripe directly so the donation shows up even if the webhook is
 * delayed or not configured (e.g. local development without the Stripe CLI).
 */
async function Result({ searchParams }: { searchParams: PageProps<"/donate/success">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : null;
  if (!sessionId || !isStripeConfigured()) return <Fallback />;

  let paid = false;
  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      paid = true;
      await completeDonation({
        sessionId: session.id,
        amountTotal: session.amount_total,
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      });
    }
  } catch (err) {
    console.error("Failed to reconcile Stripe session", err);
    return <Fallback />;
  }

  const [d] = await db.select().from(donations).where(eq(donations.stripeSessionId, sessionId));
  if (!d) return <Fallback />;

  return (
    <Card className="w-full max-w-lg text-center">
      <CardHeader className="items-center">
        {paid ? (
          <CircleCheckBig className="mx-auto size-12 text-emerald-600" />
        ) : (
          <Clock className="mx-auto size-12 text-amber-500" />
        )}
        <CardTitle className="text-2xl">{paid ? "Thank you!" : "Payment processing"}</CardTitle>
        <CardDescription>
          {paid
            ? `Your ${formatMoney(d.amountCents, d.currency)} donation has been received${
                d.caseId ? " and added to this animal's fund" : " by the general fund"
              }.`
            : "Your payment is still being confirmed. It will appear on the case once complete."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        {d.caseId && (
          <Button asChild>
            <Link href={`/cases/${d.caseId}`}>Back to the case</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/cases">See other animals</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function Fallback() {
  return (
    <Card className="w-full max-w-lg text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Thank you!</CardTitle>
        <CardDescription>If your payment went through, it will appear on the case shortly.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link href="/cases">Browse cases</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DonateSuccessPage(props: PageProps<"/donate/success">) {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-16">
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-lg rounded-xl" />}>
        <Result searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
