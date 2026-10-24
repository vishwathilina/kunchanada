"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, vetProfiles } from "@/db/schema";
import { fromZodError, toActionError, type ActionState } from "@/lib/action-state";
import { createSession, destroySession } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notify";
import { loginSchema, registerSchema } from "@/lib/validators";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;

  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email));
    if (existing.length > 0) {
      return { error: "An account with this email already exists.", fieldErrors: { email: ["Already registered"] } };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role,
          phone: data.phone,
          city: data.city,
          lat: data.lat,
          lng: data.lng,
          serviceRadiusKm: data.serviceRadiusKm,
        })
        .returning({ id: users.id, role: users.role, name: users.name });

      if (data.role === "vet") {
        await tx.insert(vetProfiles).values({
          userId: created.id,
          licenseNumber: data.licenseNumber!,
          clinicName: data.clinicName,
        });
        await notifyAdmins(tx, {
          type: "vet_verified",
          title: "New vet awaiting verification",
          body: `${data.name} (license ${data.licenseNumber}) registered as a vet.`,
        });
      }
      return created;
    });

    await createSession(user);
  } catch (err) {
    return toActionError(err);
  }

  redirect("/dashboard?welcome=1");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { email, password, next } = parsed.data;

  try {
    const [user] = await db
      .select({ id: users.id, role: users.role, name: users.name, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email));

    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) return { error: "Incorrect email or password." };

    await createSession(user);
  } catch (err) {
    return toActionError(err);
  }

  redirect(safeNext(next));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
