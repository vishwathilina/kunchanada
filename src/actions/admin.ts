"use server";

import { eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { caseFlags, cases, caseUpdates, expenses, vetProfiles } from "@/db/schema";
import { toActionError, UserError, type ActionState } from "@/lib/action-state";
import { assertUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { notifyUsers } from "@/lib/notify";

async function assertAdmin() {
  return assertUser(["admin"]);
}

export async function verifyVetAction(userId: string): Promise<ActionState> {
  try {
    const admin = await assertAdmin();
    await db.transaction(async (tx) => {
      const [profile] = await tx.select().from(vetProfiles).where(eq(vetProfiles.userId, userId));
      if (!profile) throw new UserError("No vet profile found.");
      if (profile.verifiedAt) throw new UserError("Already verified.");
      await tx
        .update(vetProfiles)
        .set({ verifiedAt: new Date(), verifiedById: admin.id, rejectedReason: null })
        .where(eq(vetProfiles.userId, userId));
      await notifyUsers(tx, [userId], {
        type: "vet_verified",
        title: "You're a verified vet",
        body: "You can now claim vet slots and appear in emergency contacts.",
      });
    });
    refresh();
    return { ok: true, message: "Vet verified." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function rejectVetAction(userId: string, reason: string): Promise<ActionState> {
  try {
    await assertAdmin();
    const trimmed = reason.trim();
    if (trimmed.length < 5) throw new UserError("Give a short reason (at least 5 characters).");
    if (trimmed.length > 500) throw new UserError("Reason is too long.");
    await db.transaction(async (tx) => {
      const [profile] = await tx.select().from(vetProfiles).where(eq(vetProfiles.userId, userId));
      if (!profile) throw new UserError("No vet profile found.");
      if (profile.verifiedAt) throw new UserError("This vet is already verified.");
      await tx.update(vetProfiles).set({ rejectedReason: trimmed }).where(eq(vetProfiles.userId, userId));
      await notifyUsers(tx, [userId], {
        type: "vet_verified",
        title: "License needs another look",
        body: trimmed,
      });
    });
    refresh();
    return { ok: true, message: "Rejection sent." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function dismissFlagAction(flagId: string): Promise<ActionState> {
  try {
    const admin = await assertAdmin();
    const [flag] = await db.select().from(caseFlags).where(eq(caseFlags.id, flagId));
    if (!flag || flag.status !== "open") throw new UserError("Flag already handled.");
    await db
      .update(caseFlags)
      .set({ status: "dismissed", resolvedById: admin.id })
      .where(eq(caseFlags.id, flagId));
    refresh();
    return { ok: true, message: "Flag dismissed." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function hideFlaggedCaseAction(flagId: string): Promise<ActionState> {
  try {
    const admin = await assertAdmin();
    await db.transaction(async (tx) => {
      const [flag] = await tx.select().from(caseFlags).where(eq(caseFlags.id, flagId));
      if (!flag || flag.status !== "open") throw new UserError("Flag already handled.");
      await tx.update(cases).set({ isHidden: true, updatedAt: new Date() }).where(eq(cases.id, flag.caseId));
      await tx
        .update(caseFlags)
        .set({ status: "actioned", resolvedById: admin.id })
        .where(eq(caseFlags.id, flagId));
    });
    refresh();
    return { ok: true, message: "Case hidden from the public list." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function reviewExpenseAction(expenseId: string, decision: "approved" | "rejected"): Promise<ActionState> {
  try {
    const admin = await assertAdmin();
    await db.transaction(async (tx) => {
      const [e] = await tx.select().from(expenses).where(eq(expenses.id, expenseId));
      if (!e) throw new UserError("Expense not found.");
      if (e.status !== "pending") throw new UserError("This expense was already reviewed.");

      await tx
        .update(expenses)
        .set({ status: decision, reviewedById: admin.id, reviewedAt: new Date() })
        .where(eq(expenses.id, expenseId));

      if (decision === "approved") {
        await tx
          .update(cases)
          .set({ spentCents: sql`${cases.spentCents} + ${e.amountCents}`, updatedAt: new Date() })
          .where(eq(cases.id, e.caseId));
        await tx.insert(caseUpdates).values({
          caseId: e.caseId,
          userId: admin.id,
          type: "expense",
          message: `Expense approved: ${formatMoney(e.amountCents)} — ${e.description}`,
        });
      }

      await notifyUsers(tx, [e.userId], {
        type: "expense_reviewed",
        caseId: e.caseId,
        title: decision === "approved" ? "Expense approved" : "Expense declined",
        body: `${formatMoney(e.amountCents)} — ${e.description}`,
      });
    });
    refresh();
    return { ok: true, message: decision === "approved" ? "Expense approved." : "Expense declined." };
  } catch (err) {
    return toActionError(err);
  }
}
