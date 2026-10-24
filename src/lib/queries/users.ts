import "server-only";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { badges, caseResponders, cases, userBadges, users, vetProfiles } from "@/db/schema";

export type LeaderboardRow = {
  id: string;
  name: string;
  city: string;
  role: string;
  points: number;
  badgeCount: number;
  rank: number;
};

export async function getLeaderboard(opts: { period: "all" | "month"; city?: string; limit?: number }) {
  const cityFilter = opts.city ? sql`AND lower(u.city) = lower(${opts.city})` : sql``;
  const pointsExpr =
    opts.period === "month"
      ? sql`COALESCE((SELECT SUM(p.points) FROM points_ledger p WHERE p.user_id = u.id AND p.created_at >= date_trunc('month', now())), 0)`
      : sql`u.points`;
  const result = await db.execute<{
    id: string;
    name: string;
    city: string;
    role: string;
    points: string;
    badge_count: string;
  }>(sql`
    SELECT u.id, u.name, u.city, u.role::text AS role,
           ${pointsExpr} AS points,
           (SELECT count(*) FROM user_badges b WHERE b.user_id = u.id) AS badge_count
    FROM users u
    WHERE u.role <> 'admin' ${cityFilter}
    AND ${pointsExpr} > 0
    ORDER BY points DESC, u.created_at ASC
    LIMIT ${opts.limit ?? 50}
  `);

  let rank = 0;
  let prev: number | null = null;
  return result.rows.map<LeaderboardRow>((r, i) => {
    const points = Number(r.points);
    if (points !== prev) rank = i + 1;
    prev = points;
    return { id: r.id, name: r.name, city: r.city, role: r.role, points, badgeCount: Number(r.badge_count), rank };
  });
}

export async function getLeaderboardCities() {
  const rows = await db
    .select({ city: users.city, count: sql<number>`count(*)::int` })
    .from(users)
    .where(ne(users.role, "admin"))
    .groupBy(users.city)
    .orderBy(desc(sql`count(*)`))
    .limit(20);
  return rows;
}

export async function getUserStats(userId: string) {
  const result = await db.execute<{
    reports: string;
    helped: string;
    checkins: string;
    treatments: string;
    saves: string;
    donated: string;
    rank: string;
  }>(sql`
    SELECT
      (SELECT count(*) FROM cases WHERE reporter_id = ${userId}) AS reports,
      (SELECT count(*) FROM case_responders WHERE user_id = ${userId} AND status <> 'left') AS helped,
      (SELECT count(*) FROM case_responders WHERE user_id = ${userId} AND checked_in_at IS NOT NULL) AS checkins,
      (SELECT count(*) FROM treatment_reports WHERE vet_id = ${userId}) AS treatments,
      (SELECT count(*) FROM case_responders r JOIN cases c ON c.id = r.case_id
         WHERE r.user_id = ${userId} AND r.status <> 'left' AND c.outcome IN ('recovered','released','adopted')) AS saves,
      (SELECT COALESCE(SUM(amount_cents), 0) FROM donations WHERE donor_id = ${userId} AND status = 'completed') AS donated,
      (SELECT count(*) + 1 FROM users o WHERE o.role <> 'admin'
         AND o.points > (SELECT points FROM users WHERE id = ${userId})) AS rank
  `);
  const r = result.rows[0]!;
  return {
    reports: Number(r.reports),
    helped: Number(r.helped),
    checkins: Number(r.checkins),
    treatments: Number(r.treatments),
    saves: Number(r.saves),
    donatedCents: Number(r.donated),
    rank: Number(r.rank),
  };
}

export async function getUserBadges(userId: string) {
  const [all, earned] = await Promise.all([
    db.select().from(badges),
    db.select().from(userBadges).where(eq(userBadges.userId, userId)),
  ]);
  const earnedMap = new Map(earned.map((e) => [e.badgeId, e.awardedAt]));
  return all.map((b) => ({ ...b, awardedAt: earnedMap.get(b.id) ?? null }));
}

export async function getPublicProfile(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      city: users.city,
      bio: users.bio,
      points: users.points,
      createdAt: users.createdAt,
      clinicName: vetProfiles.clinicName,
      vetVerifiedAt: vetProfiles.verifiedAt,
    })
    .from(users)
    .leftJoin(vetProfiles, eq(vetProfiles.userId, users.id))
    .where(eq(users.id, userId));
  return row ?? null;
}

/** Case IDs the user is (or was) actively responding to, newest first. */
export async function getRespondedCaseIds(userId: string, activeOnly = false) {
  const rows = await db
    .select({ caseId: caseResponders.caseId, status: caseResponders.status, role: caseResponders.role })
    .from(caseResponders)
    .innerJoin(cases, eq(cases.id, caseResponders.caseId))
    .where(
      and(
        eq(caseResponders.userId, userId),
        ne(caseResponders.status, "left"),
        activeOnly ? ne(cases.status, "resolved") : undefined,
      ),
    )
    .orderBy(desc(caseResponders.claimedAt))
    .limit(30);
  return rows;
}

