"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { caseResponders, cases, caseUpdates, donations, expenses } from "@/db/schema";
import { fromZodError, toActionError, UserError, type ActionState } from "@/lib/action-state";
import { assertUser, getCurrentUser } from "@/lib/auth";
import { CURRENCY, formatMoney } from "@/lib/format";
import { notifyAdmins } from "@/lib/notify";
import { appUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { donationSchema, expenseSchema } from "@/lib/validators";

export async function donateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let checkoutUrl: string;
  try {
    if (!isStripeConfigured()) {
      throw new UserError("Donations aren't configured yet. Add your Stripe keys to enable them.");
    }
    const parsed = donationSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    const d = parsed.data;
    const user = await getCurrentUser();

    let caseTitle: string | null = null;
    if (d.caseId) {
      const [c] = await db.select({ title: cases.title, isHidden: cases.isHidden }).from(cases).where(eq(cases.id, d.caseId));
      if (!c || c.isHidden) throw new UserError("This case can't receive donations.");
      caseTitle = c.title;
    }

    const amountCents = Math.round(d.amount * 100);
    const donationId = crypto.randomUUID();
    const returnPath = d.caseId ? `/cases/${d.caseId}` : "/donate";
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      client_reference_id: donationId,
      customer_email: user?.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: amountCents,
            product_data: {
              name: caseTitle ? `Donation: ${caseTitle}` : "Donation: Kunchanada general fund",
              description: caseTitle
                ? "Funds this animal's treatment. Spending is published with receipts."
                : "Covers cases with no direct donations.",
            },
          },
        },
      ],
      metadata: { donationId, caseId: d.caseId ?? "" },
      success_url: `${appUrl()}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}${returnPath}?donation=cancelled`,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");

    await db.insert(donations).values({
      id: donationId,
      caseId: d.caseId ?? null,
      donorId: user?.id ?? null,
      donorName: d.isAnonymous ? null : (d.donorName ?? user?.name ?? null),
      isAnonymous: d.isAnonymous,
      message: d.message,
      amountCents,
      currency: CURRENCY,
      stripeSessionId: session.id,
    });
    checkoutUrl = session.url;
  } catch (err) {
    return toActionError(err);
  }

  redirect(checkoutUrl);
}

export async function addExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    const d = parsed.data;

    await db.transaction(async (tx) => {
      const [c] = await tx.select().from(cases).where(eq(cases.id, d.caseId));
      if (!c) throw new UserError("Case not found.");
      const [mine] = await tx
        .select({ status: caseResponders.status })
        .from(caseResponders)
        .where(and(eq(caseResponders.caseId, d.caseId), eq(caseResponders.userId, user.id)));
      const allowed = user.role === "admin" || c.reporterId === user.id || (mine && mine.status !== "left");
      if (!allowed) throw new UserError("Only the reporter and responders can log expenses.");

      const amountCents = Math.round(d.amount * 100);
      await tx.insert(expenses).values({
        caseId: d.caseId,
        userId: user.id,
        amountCents,
        description: d.description,
        receiptUrl: d.receiptUrl,
      });
      await tx.insert(caseUpdates).values({
        caseId: d.caseId,
        userId: user.id,
        type: "expense",
        message: `${user.name} logged an expense of ${formatMoney(amountCents)}: ${d.description} (pending review)`,
      });
      await notifyAdmins(tx, {
        type: "expense_reviewed",
        caseId: d.caseId,
        title: "Expense awaiting review",
        body: `${formatMoney(amountCents)} — ${d.description} on "${c.title}"`,
      });
    });
    refresh();
    return { ok: true, message: "Expense submitted for review." };
  } catch (err) {
    return toActionError(err);
  }
}
