import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { cases, caseUpdates, donations } from "@/db/schema";
import { POINTS } from "./constants";
import { formatMoney } from "./format";
import { awardPoints } from "./gamification";
import { notifyUsers } from "./notify";

/**
 * Marks a Stripe Checkout donation as paid. Safe to call more than once (webhook retries,
 * success-page reconciliation): only the first call changes anything.
 */
export async function completeDonation(opts: {
  sessionId: string;
  amountTotal: number | null;
  paymentIntentId: string | null;
}) {
  return db.transaction(async (tx) => {
    const [d] = await tx
      .update(donations)
      .set({
        status: "completed",
        completedAt: new Date(),
        stripePaymentIntentId: opts.paymentIntentId,
        ...(opts.amountTotal ? { amountCents: opts.amountTotal } : {}),
      })
      .where(and(eq(donations.stripeSessionId, opts.sessionId), ne(donations.status, "completed")))
      .returning();
    if (!d) return null;

    if (d.caseId) {
      const [c] = await tx
        .update(cases)
        .set({ raisedCents: sql`${cases.raisedCents} + ${d.amountCents}`, updatedAt: new Date() })
        .where(eq(cases.id, d.caseId))
        .returning({ id: cases.id, title: cases.title, reporterId: cases.reporterId });
      if (c) {
        const who = d.isAnonymous || !d.donorName ? "Someone" : d.donorName;
        await tx.insert(caseUpdates).values({
          caseId: c.id,
          userId: d.isAnonymous ? null : d.donorId,
          type: "donation",
          message: `${who} donated ${formatMoney(d.amountCents, d.currency)}`,
        });
        await notifyUsers(tx, [c.reporterId].filter((id) => id !== d.donorId), {
          type: "donation_received",
          caseId: c.id,
          title: "New donation",
          body: `${who} donated ${formatMoney(d.amountCents, d.currency)} to "${c.title}"`,
        });
      }
    }

    if (d.donorId) {
      const points = Math.min(POINTS.donation_max, Math.floor(d.amountCents / 100));
      await awardPoints(tx, d.donorId, "donation", Math.max(1, points), d.id);
    }
    return d;
  });
}

export async function failDonation(sessionId: string) {
  await db
    .update(donations)
    .set({ status: "failed" })
    .where(and(eq(donations.stripeSessionId, sessionId), eq(donations.status, "pending")));
}
