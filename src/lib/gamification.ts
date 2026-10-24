import "server-only";
import { eq, sql } from "drizzle-orm";
import type { DbOrTx } from "@/db";
import { pointsLedger, userBadges, users } from "@/db/schema";
import { BADGES } from "./constants";
import { notifyUsers } from "./notify";

const BADGE_TIMEZONE = process.env.APP_TIMEZONE ?? "UTC";

/**
 * Idempotent: the same (user, reason, refId) only ever pays out once, so retries and
 * double-clicks can't farm points.
 */
export async function awardPoints(
  tx: DbOrTx,
  userId: string,
  reason: string,
  points: number,
  refId: string,
): Promise<boolean> {
  if (points <= 0) return false;
  const inserted = await tx
    .insert(pointsLedger)
    .values({ userId, reason, points, refId })
    .onConflictDoNothing()
    .returning({ id: pointsLedger.id });
  if (inserted.length === 0) return false;
  await tx
    .update(users)
    .set({ points: sql`${users.points} + ${points}` })
    .where(eq(users.id, userId));
  await evaluateBadges(tx, userId);
  return true;
}

type Stats = {
  reports: number;
  checkins: number;
  helped: number;
  night: number;
  treatments: number;
  saves: number;
  donations: number;
  points: number;
};

const RULES: Record<string, (s: Stats) => boolean> = {
  "first-report": (s) => s.reports >= 1,
  "first-responder": (s) => s.checkins >= 1,
  "guardian-angel": (s) => s.helped >= 10,
  "night-owl": (s) => s.night >= 1,
  healer: (s) => s.treatments >= 5,
  lifesaver: (s) => s.saves >= 10,
  "generous-heart": (s) => s.donations >= 1,
  "community-pillar": (s) => s.points >= 500,
};

export async function evaluateBadges(tx: DbOrTx, userId: string): Promise<string[]> {
  const result = await tx.execute<Record<keyof Stats, string | number>>(sql`
    SELECT
      (SELECT count(*) FROM cases WHERE reporter_id = ${userId}) AS reports,
      (SELECT count(*) FROM case_responders WHERE user_id = ${userId} AND checked_in_at IS NOT NULL) AS checkins,
      (SELECT count(*) FROM case_responders WHERE user_id = ${userId} AND status <> 'left') AS helped,
      (SELECT count(*) FROM case_responders
         WHERE user_id = ${userId} AND checked_in_at IS NOT NULL
           AND (extract(hour FROM checked_in_at AT TIME ZONE ${BADGE_TIMEZONE}) >= 22
             OR extract(hour FROM checked_in_at AT TIME ZONE ${BADGE_TIMEZONE}) < 5)) AS night,
      (SELECT count(*) FROM treatment_reports WHERE vet_id = ${userId}) AS treatments,
      (SELECT count(*) FROM case_responders r JOIN cases c ON c.id = r.case_id
         WHERE r.user_id = ${userId} AND r.status <> 'left'
           AND c.outcome IN ('recovered', 'released', 'adopted')) AS saves,
      (SELECT count(*) FROM donations WHERE donor_id = ${userId} AND status = 'completed') AS donations,
      (SELECT points FROM users WHERE id = ${userId}) AS points
  `);
  const row = result.rows[0];
  if (!row) return [];
  const stats = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, Number(v ?? 0)]),
  ) as Stats;

  const earned = Object.entries(RULES)
    .filter(([, rule]) => rule(stats))
    .map(([id]) => id);
  if (earned.length === 0) return [];

  const inserted = await tx
    .insert(userBadges)
    .values(earned.map((badgeId) => ({ userId, badgeId })))
    .onConflictDoNothing()
    .returning({ badgeId: userBadges.badgeId });

  for (const { badgeId } of inserted) {
    const badge = BADGES.find((b) => b.id === badgeId);
    if (!badge) continue;
    await notifyUsers(tx, [userId], {
      type: "badge_earned",
      title: `New badge: ${badge.name}`,
      body: badge.description,
    });
  }
  return inserted.map((b) => b.badgeId);
}
