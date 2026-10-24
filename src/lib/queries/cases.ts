import "server-only";
import { and, asc, desc, eq, inArray, ne, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  caseFlags,
  caseImages,
  caseResponders,
  cases,
  caseUpdates,
  donations,
  escalations,
  expenses,
  treatmentReports,
  users,
  vetProfiles,
} from "@/db/schema";
import type { CaseStatus, Severity } from "@/lib/constants";
import { pointSql } from "@/lib/geo";
import { computePriority } from "@/lib/priority";

export type CaseFilter = {
  scope?: "open" | "resolved" | "all";
  severity?: Severity;
  species?: string;
  near?: { lat: number; lng: number; radiusKm: number };
  reporterId?: string;
  ids?: string[];
  limit?: number;
};

export type CaseListItem = {
  id: string;
  title: string;
  species: string;
  severity: Severity;
  status: CaseStatus;
  outcome: string | null;
  lat: number;
  lng: number;
  city: string | null;
  addressText: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  imageUrl: string | null;
  volunteers: number;
  vets: number;
  maxVolunteers: number;
  maxVets: number;
  vetCheckedIn: boolean;
  fundingGoalCents: number;
  raisedCents: number;
  distanceMeters: number | null;
  priority: number;
};

const activeResponders = (role: "volunteer" | "vet") =>
  sql<number>`(SELECT count(*)::int FROM case_responders r WHERE r.case_id = ${cases.id} AND r.role = ${role} AND r.status <> 'left')`;

export async function listCases(filter: CaseFilter = {}): Promise<CaseListItem[]> {
  const scope = filter.scope ?? "open";
  const point = filter.near ? pointSql(filter.near.lat, filter.near.lng) : null;

  const conditions: (SQL | undefined)[] = [eq(cases.isHidden, false)];
  if (scope === "open") conditions.push(ne(cases.status, "resolved"));
  if (scope === "resolved") conditions.push(eq(cases.status, "resolved"));
  if (filter.severity) conditions.push(eq(cases.severity, filter.severity));
  if (filter.species) conditions.push(eq(cases.species, filter.species));
  if (filter.reporterId) conditions.push(eq(cases.reporterId, filter.reporterId));
  if (filter.ids) {
    if (filter.ids.length === 0) return [];
    conditions.push(inArray(cases.id, filter.ids));
  }
  if (point && filter.near) {
    conditions.push(sql`ST_DWithin(${cases.location}, ${point}, ${filter.near.radiusKm * 1000})`);
  }

  const rows = await db
    .select({
      id: cases.id,
      title: cases.title,
      species: cases.species,
      severity: cases.severity,
      status: cases.status,
      outcome: cases.outcome,
      lat: cases.lat,
      lng: cases.lng,
      city: cases.city,
      addressText: cases.addressText,
      createdAt: cases.createdAt,
      resolvedAt: cases.resolvedAt,
      maxVolunteers: cases.maxVolunteers,
      maxVets: cases.maxVets,
      fundingGoalCents: cases.fundingGoalCents,
      raisedCents: cases.raisedCents,
      imageUrl: sql<string | null>`(SELECT i.url FROM case_images i WHERE i.case_id = ${cases.id} ORDER BY i.created_at LIMIT 1)`,
      volunteers: activeResponders("volunteer"),
      vets: activeResponders("vet"),
      vetCheckedIn: sql<boolean>`EXISTS (SELECT 1 FROM case_responders r WHERE r.case_id = ${cases.id} AND r.role = 'vet' AND r.status = 'checked_in')`,
      distanceMeters: point ? sql<number>`ST_Distance(${cases.location}, ${point})` : sql<null>`NULL`,
    })
    .from(cases)
    .where(and(...conditions))
    .orderBy(scope === "resolved" ? desc(cases.resolvedAt) : desc(cases.createdAt))
    .limit(filter.limit ?? 200);

  const now = Date.now();
  const items = rows.map<CaseListItem>((r) => ({
    ...r,
    distanceMeters: r.distanceMeters === null ? null : Number(r.distanceMeters),
    priority: computePriority(
      {
        severity: r.severity,
        status: r.status,
        createdAt: r.createdAt,
        openVolunteerSlots: Math.max(0, r.maxVolunteers - r.volunteers),
        openVetSlots: Math.max(0, r.maxVets - r.vets),
        vetCheckedIn: r.vetCheckedIn,
      },
      now,
    ),
  }));

  if (scope !== "resolved") {
    items.sort((a, b) => {
      if ((a.status === "resolved") !== (b.status === "resolved")) return a.status === "resolved" ? 1 : -1;
      return b.priority - a.priority;
    });
  }
  return items;
}

export async function getCaseDetail(id: string) {
  const found = await db.query.cases.findFirst({
    where: eq(cases.id, id),
    with: {
      reporter: { columns: { id: true, name: true, points: true } },
      images: { orderBy: asc(caseImages.createdAt) },
    },
  });
  if (!found) return null;

  const [responders, updates, treatments, caseExpenses, caseDonations, escalationRows, openFlags] = await Promise.all([
    db
      .select({
        id: caseResponders.id,
        userId: caseResponders.userId,
        role: caseResponders.role,
        status: caseResponders.status,
        claimedAt: caseResponders.claimedAt,
        checkedInAt: caseResponders.checkedInAt,
        name: users.name,
        phone: users.phone,
        points: users.points,
      })
      .from(caseResponders)
      .innerJoin(users, eq(users.id, caseResponders.userId))
      .where(eq(caseResponders.caseId, id))
      .orderBy(asc(caseResponders.claimedAt)),
    db
      .select({
        id: caseUpdates.id,
        type: caseUpdates.type,
        message: caseUpdates.message,
        createdAt: caseUpdates.createdAt,
        userId: caseUpdates.userId,
        userName: users.name,
      })
      .from(caseUpdates)
      .leftJoin(users, eq(users.id, caseUpdates.userId))
      .where(eq(caseUpdates.caseId, id))
      .orderBy(desc(caseUpdates.createdAt)),
    db
      .select({
        report: treatmentReports,
        vetName: users.name,
        clinicName: vetProfiles.clinicName,
      })
      .from(treatmentReports)
      .innerJoin(users, eq(users.id, treatmentReports.vetId))
      .leftJoin(vetProfiles, eq(vetProfiles.userId, treatmentReports.vetId))
      .where(eq(treatmentReports.caseId, id))
      .orderBy(desc(treatmentReports.createdAt)),
    db
      .select({
        id: expenses.id,
        amountCents: expenses.amountCents,
        description: expenses.description,
        receiptUrl: expenses.receiptUrl,
        status: expenses.status,
        createdAt: expenses.createdAt,
        userId: expenses.userId,
        userName: users.name,
      })
      .from(expenses)
      .innerJoin(users, eq(users.id, expenses.userId))
      .where(eq(expenses.caseId, id))
      .orderBy(desc(expenses.createdAt)),
    db
      .select({
        id: donations.id,
        amountCents: donations.amountCents,
        currency: donations.currency,
        donorName: donations.donorName,
        isAnonymous: donations.isAnonymous,
        message: donations.message,
        completedAt: donations.completedAt,
      })
      .from(donations)
      .where(and(eq(donations.caseId, id), eq(donations.status, "completed")))
      .orderBy(desc(donations.completedAt))
      .limit(20),
    db
      .select({ id: escalations.id, createdAt: escalations.createdAt })
      .from(escalations)
      .where(eq(escalations.caseId, id))
      .orderBy(desc(escalations.createdAt)),
    db
      .select({ id: caseFlags.id })
      .from(caseFlags)
      .where(and(eq(caseFlags.caseId, id), inArray(caseFlags.status, ["open"]))),
  ]);

  const active = responders.filter((r) => r.status !== "left");
  return {
    ...found,
    responders,
    activeVolunteers: active.filter((r) => r.role === "volunteer"),
    activeVets: active.filter((r) => r.role === "vet"),
    updates,
    treatments,
    expenses: caseExpenses,
    donations: caseDonations,
    escalations: escalationRows,
    openFlagCount: openFlags.length,
  };
}

export type CaseDetail = NonNullable<Awaited<ReturnType<typeof getCaseDetail>>>;
