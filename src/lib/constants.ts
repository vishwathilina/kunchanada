export const ROLES = ["volunteer", "vet", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const SEVERITIES = ["critical", "urgent", "stable"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_META: Record<
  Severity,
  { label: string; description: string; weight: number; color: string }
> = {
  critical: {
    label: "Critical",
    description: "Life-threatening: heavy bleeding, hit by vehicle, unable to move",
    weight: 100,
    color: "#dc2626",
  },
  urgent: {
    label: "Urgent",
    description: "Needs care within hours: wounds, infection, trapped",
    weight: 60,
    color: "#ea580c",
  },
  stable: {
    label: "Stable",
    description: "Needs help but not time critical: malnourished, skin disease",
    weight: 25,
    color: "#16a34a",
  },
};

export const CASE_STATUSES = [
  "reported",
  "verified",
  "assigned",
  "in_treatment",
  "resolved",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const STATUS_LABELS: Record<CaseStatus, string> = {
  reported: "Reported",
  verified: "Verified",
  assigned: "Help on the way",
  in_treatment: "In treatment",
  resolved: "Resolved",
};

export const OUTCOMES = [
  "recovered",
  "released",
  "adopted",
  "transferred",
  "deceased",
  "not_found",
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const OUTCOME_LABELS: Record<Outcome, string> = {
  recovered: "Recovered",
  released: "Released back safely",
  adopted: "Adopted",
  transferred: "Transferred to shelter / hospital",
  deceased: "Passed away",
  not_found: "Animal not found",
};

export const POSITIVE_OUTCOMES: Outcome[] = ["recovered", "released", "adopted"];

export const SPECIES = [
  "dog",
  "cat",
  "cow",
  "bird",
  "horse",
  "goat",
  "monkey",
  "donkey",
  "pig",
  "rabbit",
  "other",
] as const;
export type Species = (typeof SPECIES)[number];

export const INJURY_TAGS = [
  "road-accident",
  "fracture",
  "bleeding",
  "open-wound",
  "maggot-wound",
  "burn",
  "skin-infection",
  "mange",
  "eye-injury",
  "dehydration",
  "malnutrition",
  "poisoning",
  "trapped",
  "entangled",
  "paralysis",
  "respiratory",
  "pregnancy-complication",
  "orphaned",
  "heatstroke",
  "abuse",
] as const;

export const RESPONDER_STATUSES = ["claimed", "checked_in", "left"] as const;
export type ResponderStatus = (typeof RESPONDER_STATUSES)[number];

export const DONATION_STATUSES = ["pending", "completed", "failed"] as const;
export const EXPENSE_STATUSES = ["pending", "approved", "rejected"] as const;
export const FLAG_STATUSES = ["open", "dismissed", "actioned"] as const;

export const NOTIFICATION_TYPES = [
  "new_case_nearby",
  "case_claimed",
  "vet_checked_in",
  "case_update",
  "case_resolved",
  "emergency",
  "badge_earned",
  "donation_received",
  "vet_verified",
  "expense_reviewed",
  "flag",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const UPDATE_TYPES = [
  "created",
  "status_change",
  "note",
  "claim",
  "check_in",
  "leave",
  "treatment",
  "escalation",
  "outcome",
  "donation",
  "expense",
] as const;
export type UpdateType = (typeof UPDATE_TYPES)[number];

export const POINTS = {
  report: 10,
  claim: 5,
  check_in: 15,
  treatment: 30,
  resolve: 20,
  donation_max: 50,
} as const;

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const BADGES: BadgeDef[] = [
  { id: "first-report", name: "Watchful Eye", description: "Reported your first animal in need", icon: "Eye" },
  { id: "first-responder", name: "First Responder", description: "Checked in on your first case", icon: "Siren" },
  { id: "guardian-angel", name: "Guardian Angel", description: "Helped on 10 cases", icon: "Shield" },
  { id: "night-owl", name: "Night Owl", description: "Checked in on a case between 22:00 and 05:00", icon: "Moon" },
  { id: "healer", name: "Healer", description: "Filed 5 treatment reports", icon: "Stethoscope" },
  { id: "lifesaver", name: "Lifesaver", description: "Part of 10 cases with a positive outcome", icon: "HeartPulse" },
  { id: "generous-heart", name: "Generous Heart", description: "Made your first donation", icon: "HandHeart" },
  { id: "community-pillar", name: "Community Pillar", description: "Earned 500 points", icon: "Trophy" },
];

/** Geographic center of Sri Lanka. */
export const DEFAULT_MAP_CENTER: [number, number] = [7.8731, 80.7718];
export const DEFAULT_MAP_ZOOM = 7;
