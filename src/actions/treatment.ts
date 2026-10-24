"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { caseResponders, cases, caseUpdates, treatmentReports } from "@/db/schema";
import { fromZodError, toActionError, UserError, type ActionState } from "@/lib/action-state";
import { assertUser } from "@/lib/auth";
import { OUTCOME_LABELS, POINTS } from "@/lib/constants";
import { awardPoints } from "@/lib/gamification";
import { notifyCaseParticipants } from "@/lib/notify";
import { treatmentSchema } from "@/lib/validators";

export async function createTreatmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let caseId: string;
  try {
    const user = await assertUser(["vet"]);
    if (!user.isVerifiedVet) throw new UserError("Only verified vets can file treatment reports.");
    const parsed = treatmentSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    const d = parsed.data;
    caseId = d.caseId;

    await db.transaction(async (tx) => {
      const [c] = await tx.select().from(cases).where(eq(cases.id, d.caseId)).for("update");
      if (!c) throw new UserError("Case not found.");
      const [mine] = await tx
        .select()
        .from(caseResponders)
        .where(and(eq(caseResponders.caseId, d.caseId), eq(caseResponders.userId, user.id)));
      if (!mine || mine.role !== "vet" || mine.status === "left") {
        throw new UserError("Claim the vet slot on this case before filing a treatment report.");
      }

      const [report] = await tx
        .insert(treatmentReports)
        .values({
          caseId: d.caseId,
          vetId: user.id,
          diagnosis: d.diagnosis,
          injuryTags: d.injuryTags,
          medications: d.medications,
          procedures: d.procedures,
          notes: d.notes,
          outcome: d.outcome,
        })
        .returning({ id: treatmentReports.id });

      // Vet-confirmed tags are more reliable than the reporter's guess, so fold them into the case.
      const mergedTags = [...new Set([...c.injuryTags, ...d.injuryTags])];
      const now = new Date();
      await tx
        .update(cases)
        .set({
          injuryTags: mergedTags,
          status: c.status === "resolved" ? c.status : "in_treatment",
          firstVetCheckInAt: c.firstVetCheckInAt ?? now,
          updatedAt: now,
        })
        .where(eq(cases.id, d.caseId));

      await tx.insert(caseUpdates).values({
        caseId: d.caseId,
        userId: user.id,
        type: "treatment",
        message: `${user.name} filed a treatment report: ${d.diagnosis}${d.outcome ? ` (${OUTCOME_LABELS[d.outcome]})` : ""}`,
      });
      await awardPoints(tx, user.id, "treatment", POINTS.treatment, report.id);
      await notifyCaseParticipants(tx, d.caseId, user.id, {
        type: "case_update",
        title: "Treatment report filed",
        body: `${user.name}: ${d.diagnosis}`,
      });
    });
  } catch (err) {
    return toActionError(err);
  }

  redirect(`/cases/${caseId}#treatment`);
}
