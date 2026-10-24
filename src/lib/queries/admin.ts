import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { caseFlags, cases, expenses, users, vetProfiles } from "@/db/schema";
import { getFundStats, type FundStats } from "./funds";

export type PendingVet = {
  userId: string;
  name: string;
  email: string;
  city: string;
  licenseNumber: string;
  clinicName: string | null;
  licenseDocUrl: string | null;
  rejectedReason: string | null;
  createdAt: Date;
};

export async function listPendingVets(): Promise<PendingVet[]> {
  return db
    .select({
      userId: vetProfiles.userId,
      name: users.name,
      email: users.email,
      city: users.city,
      licenseNumber: vetProfiles.licenseNumber,
      clinicName: vetProfiles.clinicName,
      licenseDocUrl: vetProfiles.licenseDocUrl,
      rejectedReason: vetProfiles.rejectedReason,
      createdAt: vetProfiles.createdAt,
    })
    .from(vetProfiles)
    .innerJoin(users, eq(users.id, vetProfiles.userId))
    .where(sql`${vetProfiles.verifiedAt} IS NULL`)
    .orderBy(desc(vetProfiles.createdAt));
}

export async function listOpenFlags() {
  return db
    .select({
      id: caseFlags.id,
      reason: caseFlags.reason,
      createdAt: caseFlags.createdAt,
      caseId: cases.id,
      caseTitle: cases.title,
      caseStatus: cases.status,
      reporterName: users.name,
      flaggerName: sql<string>`(SELECT name FROM users u WHERE u.id = ${caseFlags.userId})`,
    })
    .from(caseFlags)
    .innerJoin(cases, eq(cases.id, caseFlags.caseId))
    .innerJoin(users, eq(users.id, cases.reporterId))
    .where(eq(caseFlags.status, "open"))
    .orderBy(desc(caseFlags.createdAt));
}

export async function listPendingExpenses() {
  return db
    .select({
      id: expenses.id,
      amountCents: expenses.amountCents,
      description: expenses.description,
      receiptUrl: expenses.receiptUrl,
      createdAt: expenses.createdAt,
      caseId: cases.id,
      caseTitle: cases.title,
      submitterName: users.name,
    })
    .from(expenses)
    .innerJoin(cases, eq(cases.id, expenses.caseId))
    .innerJoin(users, eq(users.id, expenses.userId))
    .where(eq(expenses.status, "pending"))
    .orderBy(desc(expenses.createdAt));
}

export type AdminStats = FundStats & {
  openCases: number;
  resolvedCases: number;
  pendingVets: number;
  openFlags: number;
  pendingExpenses: number;
  users: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [funds, [counts]] = await Promise.all([
    getFundStats(),
    db.execute<{
      open_cases: string;
      resolved_cases: string;
      pending_vets: string;
      open_flags: string;
      pending_expenses: string;
      users: string;
    }>(sql`
      SELECT
        (SELECT count(*) FROM cases WHERE status <> 'resolved' AND NOT is_hidden) AS open_cases,
        (SELECT count(*) FROM cases WHERE status = 'resolved' AND NOT is_hidden) AS resolved_cases,
        (SELECT count(*) FROM vet_profiles WHERE verified_at IS NULL) AS pending_vets,
        (SELECT count(*) FROM case_flags WHERE status = 'open') AS open_flags,
        (SELECT count(*) FROM expenses WHERE status = 'pending') AS pending_expenses,
        (SELECT count(*) FROM users WHERE role <> 'admin') AS users
    `).then((r) => r.rows),
  ]);
  return {
    ...funds,
    openCases: Number(counts?.open_cases ?? 0),
    resolvedCases: Number(counts?.resolved_cases ?? 0),
    pendingVets: Number(counts?.pending_vets ?? 0),
    openFlags: Number(counts?.open_flags ?? 0),
    pendingExpenses: Number(counts?.pending_expenses ?? 0),
    users: Number(counts?.users ?? 0),
  };
}
