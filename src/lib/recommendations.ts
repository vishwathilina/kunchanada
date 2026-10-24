import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { Medication } from "@/db/schema";
import { POSITIVE_OUTCOMES } from "./constants";

export type Suggestion = {
  id: string;
  caseId: string;
  caseTitle: string;
  vetName: string;
  diagnosis: string;
  injuryTags: string[];
  medications: Medication[];
  procedures: string | null;
  outcome: string | null;
  overlap: number;
  createdAt: Date;
};

export type SuggestionSummary = {
  suggestions: Suggestion[];
  matched: number;
  positive: number;
  withOutcome: number;
};

const textArray = (values: string[]) =>
  sql`ARRAY[${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  )}]::text[]`;

/**
 * Past treatment reports for the same species that share injury tags, ranked by
 * tag overlap first and by whether the animal ended up OK second.
 */
export async function findSimilarTreatments(opts: {
  excludeCaseId?: string;
  species: string;
  tags: string[];
  limit?: number;
}): Promise<SuggestionSummary> {
  const tags = [...new Set(opts.tags)];
  if (tags.length === 0) return { suggestions: [], matched: 0, positive: 0, withOutcome: 0 };

  const tagArr = textArray(tags);
  const positiveArr = textArray(POSITIVE_OUTCOMES);
  const exclude = opts.excludeCaseId ? sql`AND t.case_id <> ${opts.excludeCaseId}` : sql``;

  const [rows, stats] = await Promise.all([
    db.execute<{
      id: string;
      case_id: string;
      case_title: string;
      vet_name: string;
      diagnosis: string;
      injury_tags: string[];
      medications: Medication[];
      procedures: string | null;
      outcome: string | null;
      overlap: number;
      created_at: Date;
    }>(sql`
      SELECT t.id, t.case_id, c.title AS case_title, u.name AS vet_name, t.diagnosis, t.injury_tags,
             t.medications, t.procedures, t.outcome::text AS outcome, t.created_at,
             cardinality(ARRAY(SELECT unnest(t.injury_tags) INTERSECT SELECT unnest(${tagArr}))) AS overlap
      FROM treatment_reports t
      JOIN cases c ON c.id = t.case_id
      JOIN users u ON u.id = t.vet_id
      WHERE c.species = ${opts.species}
        AND t.injury_tags && ${tagArr}
        ${exclude}
      ORDER BY overlap DESC,
               (t.outcome::text = ANY(${positiveArr})) DESC NULLS LAST,
               t.created_at DESC
      LIMIT ${opts.limit ?? 5}
    `),
    db.execute<{ matched: number; positive: number; with_outcome: number }>(sql`
      SELECT count(*)::int AS matched,
             count(*) FILTER (WHERE t.outcome::text = ANY(${positiveArr}))::int AS positive,
             count(t.outcome)::int AS with_outcome
      FROM treatment_reports t
      JOIN cases c ON c.id = t.case_id
      WHERE c.species = ${opts.species}
        AND t.injury_tags && ${tagArr}
        ${exclude}
    `),
  ]);

  const s = stats.rows[0];
  return {
    suggestions: rows.rows.map((r) => ({
      id: r.id,
      caseId: r.case_id,
      caseTitle: r.case_title,
      vetName: r.vet_name,
      diagnosis: r.diagnosis,
      injuryTags: r.injury_tags,
      medications: r.medications,
      procedures: r.procedures,
      outcome: r.outcome,
      overlap: Number(r.overlap),
      createdAt: new Date(r.created_at),
    })),
    matched: Number(s?.matched ?? 0),
    positive: Number(s?.positive ?? 0),
    withOutcome: Number(s?.with_outcome ?? 0),
  };
}
