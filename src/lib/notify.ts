import "server-only";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import type { DbOrTx } from "@/db";
import { caseResponders, cases, notifications, users } from "@/db/schema";
import type { NotificationType } from "./constants";
import { pointSql } from "./geo";

type NotificationInput = {
  type: NotificationType;
  caseId?: string | null;
  title: string;
  body: string;
};

export async function notifyUsers(tx: DbOrTx, userIds: string[], n: NotificationInput) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await tx.insert(notifications).values(
    unique.map((userId) => ({
      userId,
      type: n.type,
      caseId: n.caseId ?? null,
      title: n.title,
      body: n.body,
    })),
  );
}

export async function notifyAdmins(tx: DbOrTx, n: NotificationInput) {
  const admins = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  await notifyUsers(
    tx,
    admins.map((a) => a.id),
    n,
  );
}

/**
 * Alerts available volunteers and verified vets whose own service radius covers the case.
 * Returns how many people were notified.
 */
export async function notifyNearbyResponders(
  tx: DbOrTx,
  c: { id: string; lat: number; lng: number; title: string; severity: string; reporterId: string },
): Promise<number> {
  const point = pointSql(c.lat, c.lng);
  const result = await tx.execute<{ id: string }>(sql`
    SELECT u.id
    FROM users u
    LEFT JOIN vet_profiles v ON v.user_id = u.id
    WHERE u.is_available
      AND u.id <> ${c.reporterId}
      AND u.role IN ('volunteer', 'vet')
      AND (u.role <> 'vet' OR v.verified_at IS NOT NULL)
      AND ST_DWithin(u.location, ${point}, u.service_radius_km * 1000)
    LIMIT 500
  `);
  const ids = result.rows.map((r) => r.id);
  await notifyUsers(tx, ids, {
    type: "new_case_nearby",
    caseId: c.id,
    title: "Injured animal in your area",
    body: `${c.title}. Accept if you can go and treat it, or reject if you can't.`,
  });
  return ids.length;
}

/** Reporter plus everyone currently responding to the case. */
export async function notifyCaseParticipants(
  tx: DbOrTx,
  caseId: string,
  excludeUserId: string | null,
  n: Omit<NotificationInput, "caseId">,
) {
  const [c] = await tx.select({ reporterId: cases.reporterId }).from(cases).where(eq(cases.id, caseId));
  if (!c) return;
  const responders = await tx
    .select({ userId: caseResponders.userId })
    .from(caseResponders)
    .where(and(eq(caseResponders.caseId, caseId), ne(caseResponders.status, "left")));
  const ids = [c.reporterId, ...responders.map((r) => r.userId)].filter((id) => id !== excludeUserId);
  await notifyUsers(tx, ids, { ...n, caseId });
}

export async function markNotificationsRead(tx: DbOrTx, userId: string, ids?: string[]) {
  await tx
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        sql`${notifications.readAt} IS NULL`,
        ids && ids.length > 0 ? inArray(notifications.id, ids) : undefined,
      ),
    );
}
