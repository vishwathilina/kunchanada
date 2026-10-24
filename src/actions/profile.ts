"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { users, vetProfiles } from "@/db/schema";
import { fromZodError, toActionError, UserError, type ActionState } from "@/lib/action-state";
import { assertUser } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notify";
import { profileSchema } from "@/lib/validators";

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = profileSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    const d = parsed.data;
    await db
      .update(users)
      .set({
        name: d.name,
        phone: d.phone,
        city: d.city,
        bio: d.bio ?? null,
        lat: d.lat,
        lng: d.lng,
        serviceRadiusKm: d.serviceRadiusKm,
      })
      .where(eq(users.id, user.id));
    refresh();
    return { ok: true, message: "Profile saved." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function setAvailabilityAction(isAvailable: boolean): Promise<ActionState> {
  try {
    const user = await assertUser();
    await db.update(users).set({ isAvailable }).where(eq(users.id, user.id));
    refresh();
    return {
      ok: true,
      message: isAvailable ? "You'll get alerts for animals near you." : "Alerts paused. You can turn them back on anytime.",
    };
  } catch (err) {
    return toActionError(err);
  }
}

export async function submitLicenseAction(licenseDocUrl: string): Promise<ActionState> {
  try {
    const user = await assertUser(["vet"]);
    let url: URL;
    try {
      url = new URL(licenseDocUrl);
    } catch {
      throw new UserError("Upload a valid license document.");
    }
    if (url.protocol !== "https:") throw new UserError("Upload a valid license document.");

    await db.transaction(async (tx) => {
      const [profile] = await tx.select().from(vetProfiles).where(eq(vetProfiles.userId, user.id));
      if (!profile) throw new UserError("No vet profile found.");
      await tx
        .update(vetProfiles)
        .set({ licenseDocUrl: url.toString(), rejectedReason: null })
        .where(eq(vetProfiles.userId, user.id));
      if (!profile.verifiedAt) {
        await notifyAdmins(tx, {
          type: "vet_verified",
          title: "License document uploaded",
          body: `${user.name} uploaded a license document for verification.`,
        });
      }
    });
    refresh();
    return { ok: true, message: "License uploaded. An admin will review it shortly." };
  } catch (err) {
    return toActionError(err);
  }
}
