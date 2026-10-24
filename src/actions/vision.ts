"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { caseResponders, cases } from "@/db/schema";
import { toActionError, UserError } from "@/lib/action-state";
import { assertUser } from "@/lib/auth";
import { buildPhotoReading, limitPhotoReads } from "@/lib/photo-reading";
import type { PhotoReading } from "@/lib/photo-reading-types";

export type ReadingResult = { ok: true; reading: PhotoReading } | { ok: false; error: string };

export async function assessPhotosAction(imageUrls: string[]): Promise<ReadingResult> {
  try {
    const user = await assertUser();
    limitPhotoReads(user.id);
    if (!Array.isArray(imageUrls) || imageUrls.some((url) => typeof url !== "string")) {
      throw new UserError("Add a photo first.");
    }
    const reading = await buildPhotoReading(imageUrls);
    return { ok: true, reading };
  } catch (err) {
    return { ok: false, error: toActionError(err).error ?? "The photo reading didn't complete." };
  }
}

export async function readCasePhotosAction(caseId: string): Promise<ReadingResult> {
  try {
    const user = await assertUser();
    limitPhotoReads(user.id);
    const found = await db.query.cases.findFirst({
      where: eq(cases.id, caseId),
      columns: { id: true, reporterId: true },
      with: { images: { columns: { url: true } } },
    });
    if (!found) throw new UserError("That case is no longer here.");

    const [slot] = await db
      .select({ id: caseResponders.id })
      .from(caseResponders)
      .where(and(eq(caseResponders.caseId, caseId), eq(caseResponders.userId, user.id)))
      .limit(1);
    const allowed = user.role === "admin" || user.role === "vet" || found.reporterId === user.id || !!slot;
    if (!allowed) throw new UserError("Only the reporter, a responder, or a vet can read these photos.");

    const reading = await buildPhotoReading(found.images.map((image) => image.url));
    await db.update(cases).set({ photoReading: reading, updatedAt: new Date() }).where(eq(cases.id, caseId));
    refresh();
    return { ok: true, reading };
  } catch (err) {
    return { ok: false, error: toActionError(err).error ?? "The photo reading didn't complete." };
  }
}
