import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type FundStats = {
  generalRaisedCents: number;
  caseRaisedCents: number;
  approvedSpentCents: number;
  coveredByGeneralCents: number;
  generalBalanceCents: number;
  donorCount: number;
  receiptsBackedPct: number;
};

/**
 * The general fund pays for whatever a case spends beyond what was donated to it directly.
 */
export async function getFundStats(): Promise<FundStats> {
  const result = await db.execute<{
    general_raised: string | null;
    case_raised: string | null;
    approved_spent: string | null;
    covered_by_general: string | null;
    donors: string | null;
    with_receipt: string | null;
  }>(sql`
    SELECT
      (SELECT COALESCE(SUM(amount_cents), 0) FROM donations WHERE status = 'completed' AND case_id IS NULL) AS general_raised,
      (SELECT COALESCE(SUM(amount_cents), 0) FROM donations WHERE status = 'completed' AND case_id IS NOT NULL) AS case_raised,
      (SELECT COALESCE(SUM(amount_cents), 0) FROM expenses WHERE status = 'approved') AS approved_spent,
      (SELECT COALESCE(SUM(GREATEST(spent_cents - raised_cents, 0)), 0) FROM cases) AS covered_by_general,
      (SELECT count(DISTINCT COALESCE(donor_id::text, stripe_session_id)) FROM donations WHERE status = 'completed') AS donors,
      (SELECT COALESCE(SUM(amount_cents) FILTER (WHERE receipt_url IS NOT NULL), 0) FROM expenses WHERE status = 'approved') AS with_receipt
  `);
  const r = result.rows[0]!;
  const general = Number(r.general_raised ?? 0);
  const covered = Number(r.covered_by_general ?? 0);
  const spent = Number(r.approved_spent ?? 0);
  return {
    generalRaisedCents: general,
    caseRaisedCents: Number(r.case_raised ?? 0),
    approvedSpentCents: spent,
    coveredByGeneralCents: covered,
    generalBalanceCents: general - covered,
    donorCount: Number(r.donors ?? 0),
    receiptsBackedPct: spent > 0 ? Math.round((Number(r.with_receipt ?? 0) / spent) * 100) : 100,
  };
}
