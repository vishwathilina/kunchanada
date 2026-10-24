"use server";

import { and, desc, eq, ne, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, type Transaction } from "@/db";
import { caseResponders, cases, caseUpdates, escalations } from "@/db/schema";
import { fromZodError, toActionError, UserError, type ActionState } from "@/lib/action-state";
import { assertUser, type CurrentUser } from "@/lib/auth";
import {
  EMERGENCY_RADIUS_KM,
  ESCALATION_COOLDOWN_MINUTES,
  viewerContext,
} from "@/lib/case-permissions";
import { OUTCOME_LABELS, POINTS } from "@/lib/constants";
import { awardPoints } from "@/lib/gamification";
import { findVerifiedVetsNear, type NearbyVet } from "@/lib/geo";
import { notifyAdmins, notifyCaseParticipants, notifyUsers } from "@/lib/notify";
import { caseUpdateSchema, resolveCaseSchema } from "@/lib/validators";

async function lockCase(tx: Transaction, caseId: string) {
  const [c] = await tx.select().from(cases).where(eq(cases.id, caseId)).for("update");
  if (!c || c.isHidden) throw new UserError("This case no longer exists.");
  return c;
}

async function responderRows(tx: Transaction, caseId: string) {
  return tx.select().from(caseResponders).where(eq(caseResponders.caseId, caseId));
}

function displayName(user: CurrentUser) {
  return user.name;
}

export async function claimSlotAction(caseId: string, role: "volunteer" | "vet"): Promise<ActionState> {
  try {
    const user = await assertUser();
    if (role === "vet" && !user.isVerifiedVet) {
      throw new UserError(
        user.role === "vet"
          ? "Your vet license hasn't been verified yet. You can join as a volunteer meanwhile."
          : "Only verified vets can take a vet slot.",
      );
    }

    await db.transaction(async (tx) => {
      const c = await lockCase(tx, caseId);
      if (c.status === "resolved") throw new UserError("This case is already resolved.");

      const rows = await responderRows(tx, caseId);
      const active = rows.filter((r) => r.status !== "left" && r.role === role);
      const max = role === "vet" ? c.maxVets : c.maxVolunteers;
      const existing = rows.find((r) => r.userId === user.id);
      if (existing && existing.status !== "left") throw new UserError("You're already responding to this case.");
      if (active.length >= max) {
        throw new UserError(`All ${role} slots are filled. Other cases nearby may need you more.`);
      }

      if (existing) {
        await tx
          .update(caseResponders)
          .set({ role, status: "claimed", claimedAt: new Date(), leftAt: null, checkedInAt: null })
          .where(eq(caseResponders.id, existing.id));
      } else {
        await tx.insert(caseResponders).values({ caseId, userId: user.id, role });
      }

      if (c.status === "reported" || c.status === "verified") {
        await tx.update(cases).set({ status: "assigned", updatedAt: new Date() }).where(eq(cases.id, caseId));
      }

      const message =
        role === "vet" ? `${displayName(user)} claimed a vet slot` : `${displayName(user)} is on the way as a volunteer`;
      await tx.insert(caseUpdates).values({ caseId, userId: user.id, type: "claim", message });
      await awardPoints(tx, user.id, "claim", POINTS.claim, caseId);
      await notifyCaseParticipants(tx, caseId, user.id, {
        type: "case_claimed",
        title: role === "vet" ? "A vet is on the way" : "A volunteer is on the way",
        body: `${message} — ${c.title}`,
      });
    });
    refresh();
    return { ok: true, message: "Thank you! The reporter has been notified you're coming." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function checkInAction(caseId: string): Promise<ActionState> {
  try {
    const user = await assertUser();
    await db.transaction(async (tx) => {
      const c = await lockCase(tx, caseId);
      if (c.status === "resolved") throw new UserError("This case is already resolved.");
      const [mine] = await tx
        .select()
        .from(caseResponders)
        .where(and(eq(caseResponders.caseId, caseId), eq(caseResponders.userId, user.id)));
      if (!mine || mine.status === "left") throw new UserError("Claim a slot before checking in.");
      if (mine.status === "checked_in") throw new UserError("You've already checked in.");

      const now = new Date();
      await tx
        .update(caseResponders)
        .set({ status: "checked_in", checkedInAt: now })
        .where(eq(caseResponders.id, mine.id));

      const patch: Partial<typeof cases.$inferInsert> = { updatedAt: now };
      if (!c.verifiedAt) patch.verifiedAt = now;
      if (mine.role === "vet") {
        if (!c.firstVetCheckInAt) patch.firstVetCheckInAt = now;
        patch.status = "in_treatment";
      }
      await tx.update(cases).set(patch).where(eq(cases.id, caseId));

      const who = mine.role === "vet" ? `${user.name} (vet)` : user.name;
      await tx.insert(caseUpdates).values({
        caseId,
        userId: user.id,
        type: "check_in",
        message: `${who} checked in on site`,
      });
      await awardPoints(tx, user.id, "check_in", POINTS.check_in, caseId);
      await notifyCaseParticipants(tx, caseId, user.id, {
        type: mine.role === "vet" ? "vet_checked_in" : "case_update",
        title: mine.role === "vet" ? "Vet is with the animal" : "Volunteer arrived",
        body: `${who} checked in — ${c.title}`,
      });
    });
    refresh();
    return { ok: true, message: "Checked in. Thank you for being there." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function leaveCaseAction(caseId: string): Promise<ActionState> {
  try {
    const user = await assertUser();
    await db.transaction(async (tx) => {
      const c = await lockCase(tx, caseId);
      const [mine] = await tx
        .select()
        .from(caseResponders)
        .where(and(eq(caseResponders.caseId, caseId), eq(caseResponders.userId, user.id)));
      if (!mine || mine.status === "left") throw new UserError("You're not responding to this case.");

      await tx
        .update(caseResponders)
        .set({ status: "left", leftAt: new Date() })
        .where(eq(caseResponders.id, mine.id));

      if (c.status === "assigned") {
        const [{ remaining }] = await tx
          .select({ remaining: sql<number>`count(*)::int` })
          .from(caseResponders)
          .where(and(eq(caseResponders.caseId, caseId), ne(caseResponders.status, "left")));
        if (remaining === 0) {
          await tx
            .update(cases)
            .set({ status: c.verifiedAt ? "verified" : "reported", updatedAt: new Date() })
            .where(eq(cases.id, caseId));
        }
      }

      await tx.insert(caseUpdates).values({
        caseId,
        userId: user.id,
        type: "leave",
        message: `${user.name} can no longer help — slot reopened`,
      });
      await notifyUsers(tx, [c.reporterId].filter((id) => id !== user.id), {
        type: "case_update",
        caseId,
        title: "A responder dropped out",
        body: `${user.name} can no longer help with "${c.title}". The slot is open again.`,
      });
    });
    refresh();
    return { ok: true, message: "You've left this case. The slot is open for someone else." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function verifyCaseAction(caseId: string): Promise<ActionState> {
  try {
    const user = await assertUser();
    await db.transaction(async (tx) => {
      const c = await lockCase(tx, caseId);
      if (c.reporterId === user.id && user.role !== "admin") {
        throw new UserError("Someone other than the reporter needs to confirm the animal is there.");
      }
      if (c.verifiedAt) throw new UserError("This case is already verified.");
      const now = new Date();
      await tx
        .update(cases)
        .set({ verifiedAt: now, status: c.status === "reported" ? "verified" : c.status, updatedAt: now })
        .where(eq(cases.id, caseId));
      await tx.insert(caseUpdates).values({
        caseId,
        userId: user.id,
        type: "status_change",
        message: `${user.name} confirmed the animal is there`,
      });
    });
    refresh();
    return { ok: true, message: "Thanks for confirming." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function postUpdateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = caseUpdateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    const { caseId, message } = parsed.data;

    await db.transaction(async (tx) => {
      const c = await lockCase(tx, caseId);
      const ctx = viewerContext(c, await responderRows(tx, caseId), user);
      if (!ctx.canPostUpdate) throw new UserError("Only the reporter and active responders can post updates.");
      await tx.insert(caseUpdates).values({ caseId, userId: user.id, type: "note", message });
      await notifyCaseParticipants(tx, caseId, user.id, {
        type: "case_update",
        title: `Update on "${c.title}"`,
        body: `${user.name}: ${message.slice(0, 140)}`,
      });
    });
    refresh();
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}

export async function resolveCaseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = resolveCaseSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    const { caseId, outcome, outcomeNote } = parsed.data;

    await db.transaction(async (tx) => {
      const c = await lockCase(tx, caseId);
      const rows = await responderRows(tx, caseId);
      const ctx = viewerContext(c, rows, user);
      if (!ctx.canResolve) {
        throw new UserError("Only the reporter, an admin, or a responder who checked in can close the case.");
      }

      const now = new Date();
      await tx
        .update(cases)
        .set({ status: "resolved", outcome, outcomeNote, resolvedAt: now, updatedAt: now })
        .where(eq(cases.id, caseId));
      await tx.insert(caseUpdates).values({
        caseId,
        userId: user.id,
        type: "outcome",
        message: `Resolved: ${OUTCOME_LABELS[outcome]}. ${outcomeNote}`,
      });

      // Everyone who actually showed up shares the resolution points.
      const helpers = rows.filter((r) => r.status === "checked_in").map((r) => r.userId);
      for (const id of new Set([...helpers, c.reporterId])) {
        await awardPoints(tx, id, "resolve", POINTS.resolve, caseId);
      }
      await notifyCaseParticipants(tx, caseId, user.id, {
        type: "case_resolved",
        title: "Case resolved",
        body: `${c.title}: ${OUTCOME_LABELS[outcome]}`,
      });
    });
    refresh();
    return { ok: true, message: "Outcome published. Thank you for seeing this through." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateSlotsAction(caseId: string, maxVolunteers: number, maxVets: number): Promise<ActionState> {
  try {
    const user = await assertUser();
    if (!Number.isInteger(maxVolunteers) || maxVolunteers < 1 || maxVolunteers > 10) {
      throw new UserError("Volunteers must be between 1 and 10.");
    }
    if (!Number.isInteger(maxVets) || maxVets < 1 || maxVets > 3) throw new UserError("Vets must be between 1 and 3.");
    await db.transaction(async (tx) => {
      const c = await lockCase(tx, caseId);
      if (c.reporterId !== user.id && user.role !== "admin") {
        throw new UserError("Only the reporter or an admin can change slots.");
      }
      await tx.update(cases).set({ maxVolunteers, maxVets, updatedAt: new Date() }).where(eq(cases.id, caseId));
    });
    refresh();
    return { ok: true, message: "Slots updated." };
  } catch (err) {
    return toActionError(err);
  }
}

export type EscalationResult = ActionState & { contacts?: NearbyVet[] };

export async function escalateAction(caseId: string): Promise<EscalationResult> {
  try {
    const user = await assertUser();
    const contacts = await db.transaction(async (tx) => {
      const c = await lockCase(tx, caseId);
      const ctx = viewerContext(c, await responderRows(tx, caseId), user);
      if (!ctx.isParticipant) throw new UserError("Only the reporter and responders can trigger an emergency.");
      if (!ctx.escalationUnlocked) {
        throw new UserError(
          c.firstVetCheckInAt
            ? "A vet has already checked in on this case."
            : `Emergency unlocks ${ctx.minutesUntilEscalation} min from now if no vet arrives.`,
        );
      }

      const vets = await findVerifiedVetsNear(c.lat, c.lng, EMERGENCY_RADIUS_KM);

      const [last] = await tx
        .select({ createdAt: escalations.createdAt })
        .from(escalations)
        .where(eq(escalations.caseId, caseId))
        .orderBy(desc(escalations.createdAt))
        .limit(1);
      const coolingDown = last && Date.now() - last.createdAt.getTime() < ESCALATION_COOLDOWN_MINUTES * 60_000;
      if (coolingDown) return vets;

      await tx.insert(escalations).values({ caseId, triggeredById: user.id });
      await tx.insert(caseUpdates).values({
        caseId,
        userId: user.id,
        type: "escalation",
        message: `${user.name} triggered an emergency — no vet has arrived yet`,
      });
      await notifyAdmins(tx, {
        type: "emergency",
        caseId,
        title: "EMERGENCY: no vet on site",
        body: `${c.title} — reported ${Math.round((Date.now() - c.createdAt.getTime()) / 60_000)} min ago`,
      });
      await notifyUsers(
        tx,
        vets.filter((v) => v.isAvailable).map((v) => v.id),
        {
          type: "emergency",
          caseId,
          title: "Emergency: a vet is needed nearby",
          body: `${c.title} — no vet has arrived yet. Can you help?`,
        },
      );
      return vets;
    });
    refresh();
    return {
      ok: true,
      contacts,
      message:
        contacts.length > 0
          ? "Admins and nearby vets have been alerted. Call the contacts below directly."
          : "Admins have been alerted. No verified vets found within range.",
    };
  } catch (err) {
    return toActionError(err);
  }
}
