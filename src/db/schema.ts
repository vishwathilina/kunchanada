import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  CASE_STATUSES,
  DONATION_STATUSES,
  EXPENSE_STATUSES,
  FLAG_STATUSES,
  NOTIFICATION_TYPES,
  OUTCOMES,
  RESPONDER_STATUSES,
  ROLES,
  SEVERITIES,
  UPDATE_TYPES,
} from "../lib/constants";

/** PostGIS geography point. Always generated from the lat/lng columns. */
const geography = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

const pointFromLatLng = sql`ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography`;

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const roleEnum = pgEnum("role", ROLES);
export const severityEnum = pgEnum("severity", SEVERITIES);
export const caseStatusEnum = pgEnum("case_status", CASE_STATUSES);
export const outcomeEnum = pgEnum("outcome", OUTCOMES);
export const responderRoleEnum = pgEnum("responder_role", ["volunteer", "vet"]);
export const responderStatusEnum = pgEnum("responder_status", RESPONDER_STATUSES);
export const donationStatusEnum = pgEnum("donation_status", DONATION_STATUSES);
export const expenseStatusEnum = pgEnum("expense_status", EXPENSE_STATUSES);
export const flagStatusEnum = pgEnum("flag_status", FLAG_STATUSES);
export const notificationTypeEnum = pgEnum("notification_type", NOTIFICATION_TYPES);
export const updateTypeEnum = pgEnum("update_type", UPDATE_TYPES);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("volunteer"),
    phone: text("phone"),
    city: text("city").notNull(),
    bio: text("bio"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    location: geography("location").generatedAlwaysAs(pointFromLatLng),
    serviceRadiusKm: integer("service_radius_km").notNull().default(10),
    isAvailable: boolean("is_available").notNull().default(true),
    points: integer("points").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    index("users_location_idx").using("gist", t.location),
    index("users_points_idx").on(t.points),
  ],
);

export const vetProfiles = pgTable("vet_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  licenseNumber: text("license_number").notNull(),
  clinicName: text("clinic_name"),
  licenseDocUrl: text("license_doc_url"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedById: uuid("verified_by_id").references(() => users.id),
  rejectedReason: text("rejected_reason"),
  createdAt: createdAt(),
});

export const cases = pgTable(
  "cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    species: text("species").notNull(),
    severity: severityEnum("severity").notNull(),
    status: caseStatusEnum("status").notNull().default("reported"),
    outcome: outcomeEnum("outcome"),
    outcomeNote: text("outcome_note"),
    injuryTags: text("injury_tags").array().notNull().default(sql`'{}'::text[]`),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    location: geography("location").generatedAlwaysAs(pointFromLatLng),
    addressText: text("address_text"),
    city: text("city"),
    maxVolunteers: integer("max_volunteers").notNull().default(3),
    maxVets: integer("max_vets").notNull().default(1),
    fundingGoalCents: integer("funding_goal_cents").notNull().default(0),
    raisedCents: integer("raised_cents").notNull().default(0),
    spentCents: integer("spent_cents").notNull().default(0),
    isHidden: boolean("is_hidden").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    firstVetCheckInAt: timestamp("first_vet_check_in_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("cases_location_idx").using("gist", t.location),
    index("cases_status_idx").on(t.status),
    index("cases_created_idx").on(t.createdAt),
    index("cases_reporter_idx").on(t.reporterId),
  ],
);

export const caseImages = pgTable(
  "case_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    key: text("key"),
    uploadedById: uuid("uploaded_by_id").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index("case_images_case_idx").on(t.caseId)],
);

export const caseResponders = pgTable(
  "case_responders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: responderRoleEnum("role").notNull(),
    status: responderStatusEnum("status").notNull().default("claimed"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("case_responders_unique_idx").on(t.caseId, t.userId),
    index("case_responders_user_idx").on(t.userId),
  ],
);

export const caseUpdates = pgTable(
  "case_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    type: updateTypeEnum("type").notNull(),
    message: text("message").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("case_updates_case_idx").on(t.caseId, t.createdAt)],
);

export type Medication = {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  durationDays?: number;
};

export const treatmentReports = pgTable(
  "treatment_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    vetId: uuid("vet_id")
      .notNull()
      .references(() => users.id),
    diagnosis: text("diagnosis").notNull(),
    injuryTags: text("injury_tags").array().notNull().default(sql`'{}'::text[]`),
    medications: jsonb("medications").$type<Medication[]>().notNull().default([]),
    procedures: text("procedures"),
    notes: text("notes"),
    outcome: outcomeEnum("outcome"),
    createdAt: createdAt(),
  },
  (t) => [
    index("treatment_reports_case_idx").on(t.caseId),
    index("treatment_reports_tags_idx").using("gin", t.injuryTags),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    amountCents: integer("amount_cents").notNull(),
    description: text("description").notNull(),
    receiptUrl: text("receipt_url"),
    status: expenseStatusEnum("status").notNull().default("pending"),
    reviewedById: uuid("reviewed_by_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("expenses_case_idx").on(t.caseId)],
);

export const donations = pgTable(
  "donations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
    donorId: uuid("donor_id").references(() => users.id, { onDelete: "set null" }),
    donorName: text("donor_name"),
    message: text("message"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(),
    stripeSessionId: text("stripe_session_id").notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    status: donationStatusEnum("status").notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("donations_session_idx").on(t.stripeSessionId),
    index("donations_case_idx").on(t.caseId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export const escalations = pgTable(
  "escalations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    triggeredById: uuid("triggered_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index("escalations_case_idx").on(t.caseId)],
);

export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    points: integer("points").notNull(),
    refId: text("ref_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("points_ledger_unique_idx").on(t.userId, t.reason, t.refId),
    index("points_ledger_created_idx").on(t.createdAt),
  ],
);

export const badges = pgTable("badges", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);

export const caseFlags = pgTable(
  "case_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: flagStatusEnum("status").notNull().default("open"),
    resolvedById: uuid("resolved_by_id").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("case_flags_unique_idx").on(t.caseId, t.userId)],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  vetProfile: one(vetProfiles, { fields: [users.id], references: [vetProfiles.userId] }),
  reportedCases: many(cases),
  responses: many(caseResponders),
  badges: many(userBadges),
}));

export const vetProfilesRelations = relations(vetProfiles, ({ one }) => ({
  user: one(users, { fields: [vetProfiles.userId], references: [users.id] }),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  reporter: one(users, { fields: [cases.reporterId], references: [users.id] }),
  images: many(caseImages),
  responders: many(caseResponders),
  updates: many(caseUpdates),
  treatments: many(treatmentReports),
  expenses: many(expenses),
  donations: many(donations),
}));

export const caseImagesRelations = relations(caseImages, ({ one }) => ({
  case: one(cases, { fields: [caseImages.caseId], references: [cases.id] }),
}));

export const caseRespondersRelations = relations(caseResponders, ({ one }) => ({
  case: one(cases, { fields: [caseResponders.caseId], references: [cases.id] }),
  user: one(users, { fields: [caseResponders.userId], references: [users.id] }),
}));

export const caseUpdatesRelations = relations(caseUpdates, ({ one }) => ({
  case: one(cases, { fields: [caseUpdates.caseId], references: [cases.id] }),
  user: one(users, { fields: [caseUpdates.userId], references: [users.id] }),
}));

export const treatmentReportsRelations = relations(treatmentReports, ({ one }) => ({
  case: one(cases, { fields: [treatmentReports.caseId], references: [cases.id] }),
  vet: one(users, { fields: [treatmentReports.vetId], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  case: one(cases, { fields: [expenses.caseId], references: [cases.id] }),
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  case: one(cases, { fields: [donations.caseId], references: [cases.id] }),
  donor: one(users, { fields: [donations.donorId], references: [users.id] }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
}));

export const caseFlagsRelations = relations(caseFlags, ({ one }) => ({
  case: one(cases, { fields: [caseFlags.caseId], references: [cases.id] }),
  user: one(users, { fields: [caseFlags.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type CaseResponder = typeof caseResponders.$inferSelect;
export type TreatmentReport = typeof treatmentReports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
