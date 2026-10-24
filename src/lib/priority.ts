import { SEVERITY_META, type CaseStatus, type Severity } from "./constants";

export type PriorityInput = {
  severity: Severity;
  status: CaseStatus;
  createdAt: Date;
  openVolunteerSlots: number;
  openVetSlots: number;
  vetCheckedIn: boolean;
};

/**
 * Higher = needs help sooner. Severity dominates, waiting time breaks ties between
 * equally severe cases, and cases that already have a vet on site drop down.
 */
export function computePriority(c: PriorityInput, now = Date.now()): number {
  if (c.status === "resolved") return 0;
  const minutesWaiting = Math.max(0, (now - c.createdAt.getTime()) / 60_000);
  const waitingScore = Math.min(60, minutesWaiting / 5);
  const openSlotsBonus = Math.min(15, c.openVolunteerSlots * 3 + c.openVetSlots * 6);
  const vetPenalty = c.vetCheckedIn ? 40 : 0;
  return Math.round(SEVERITY_META[c.severity].weight + waitingScore + openSlotsBonus - vetPenalty);
}
