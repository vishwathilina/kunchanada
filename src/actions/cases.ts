"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { caseFlags, caseImages, cases, caseUpdates } from "@/db/schema";
import { fromZodError, toActionError, UserError, type ActionState } from "@/lib/action-state";
import { assertUser } from "@/lib/auth";
import { POINTS } from "@/lib/constants";
import { awardPoints } from "@/lib/gamification";
import { notifyAdmins, notifyNearbyResponders } from "@/lib/notify";
import { createCaseSchema, flagSchema } from "@/lib/validators";

const MAX_REPORTS_PER_HOUR = 5;

export async function createCaseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let caseId: string;
  try {
    const user = await assertUser();
    const parsed = createCaseSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    const d = parsed.data;

    const [recent] = await db
      .select({ value: count() })
      .from(cases)
      .where(and(eq(cases.reporterId, user.id), gte(cases.createdAt, new Date(Date.now() - 60 * 60_000))));
    if ((recent?.value ?? 0) >= MAX_REPORTS_PER_HOUR && user.role !== "admin") {
      throw new UserError("You've filed several reports in the last hour. Please wait a bit before reporting again.");
    }

    caseId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(cases)
        .values({
          reporterId: user.id,
          title: d.title,
          description: d.description,
          species: d.species,
          severity: d.severity,
          injuryTags: d.injuryTags,
          lat: d.lat,
          lng: d.lng,
          addressText: d.addressText,
          city: d.city ?? user.city,
          maxVolunteers: d.maxVolunteers,
          maxVets: d.maxVets,
          fundingGoalCents: Math.round(d.fundingGoal * 100),
        })
        .returning();

      await tx.insert(caseImages).values(
        d.imageUrls.map((url, i) => ({
          caseId: created.id,
          url,
          key: d.imageKeys[i] || null,
          uploadedById: user.id,
        })),
      );
      await tx.insert(caseUpdates).values({
        caseId: created.id,
        userId: user.id,
        type: "created",
        message: "Case reported",
      });
      await awardPoints(tx, user.id, "report", POINTS.report, created.id);
      await notifyNearbyResponders(tx, created);
      return created.id;
    });
  } catch (err) {
    return toActionError(err);
  }

  redirect(`/cases/${caseId}?new=1`);
}

export async function flagCaseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = flagSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    const { caseId, reason } = parsed.data;

    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(caseFlags)
        .values({ caseId, userId: user.id, reason })
        .onConflictDoNothing()
        .returning({ id: caseFlags.id });
      if (inserted.length === 0) throw new UserError("You've already flagged this case.");
      await notifyAdmins(tx, {
        type: "flag",
        caseId,
        title: "Case flagged for review",
        body: reason,
      });
    });
    refresh();
    return { ok: true, message: "Thanks — an admin will review this report." };
  } catch (err) {
    return toActionError(err);
  }
}
