import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { users, vetProfiles } from "@/db/schema";
import { UserError } from "./action-state";
import type { Role } from "./constants";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./jwt";

export async function createSession(user: { id: string; role: Role; name: string }) {
  const token = await signSession({ sub: user.id, role: user.role, name: user.name });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const getSession = cache(async () => {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
});

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  city: string;
  phone: string | null;
  lat: number;
  lng: number;
  serviceRadiusKm: number;
  isAvailable: boolean;
  points: number;
  isVerifiedVet: boolean;
  vetPending: boolean;
};

/** The signed-in user, re-read from the database so role and verification are never stale. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      city: users.city,
      phone: users.phone,
      lat: users.lat,
      lng: users.lng,
      serviceRadiusKm: users.serviceRadiusKm,
      isAvailable: users.isAvailable,
      points: users.points,
      vetVerifiedAt: vetProfiles.verifiedAt,
      vetLicense: vetProfiles.licenseNumber,
    })
    .from(users)
    .leftJoin(vetProfiles, eq(vetProfiles.userId, users.id))
    .where(eq(users.id, session.sub))
    .limit(1);

  if (!row) return null;
  const { vetVerifiedAt, vetLicense, ...rest } = row;
  return {
    ...rest,
    isVerifiedVet: row.role === "vet" && vetVerifiedAt !== null,
    vetPending: row.role === "vet" && vetLicense !== null && vetVerifiedAt === null,
  };
});

export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

export async function requireRole(roles: Role[], next?: string): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

/** For Server Actions: throws instead of redirecting so the caller can return a form error. */
export async function assertUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UserError("You need to be signed in to do that.");
  if (roles && !roles.includes(user.role)) {
    throw new UserError("You don't have permission to do that.");
  }
  return user;
}
