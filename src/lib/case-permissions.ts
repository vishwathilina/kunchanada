import type { CurrentUser } from "./auth";

export const ESCALATION_MINUTES = Number(process.env.ESCALATION_MINUTES ?? 30) || 30;
export const EMERGENCY_RADIUS_KM = 25;
export const ESCALATION_COOLDOWN_MINUTES = 10;

type CaseLike = {
  reporterId: string;
  status: string;
  createdAt: Date;
  firstVetCheckInAt: Date | null;
};

type ResponderLike = { userId: string; status: string; role: string };

export function viewerContext<R extends ResponderLike>(c: CaseLike, responders: R[], user: CurrentUser | null) {
  const mine = user ? responders.find((r) => r.userId === user.id) : undefined;
  const isReporter = !!user && user.id === c.reporterId;
  const isAdmin = user?.role === "admin";
  const isActiveResponder = !!mine && mine.status !== "left";
  const isParticipant = isReporter || isActiveResponder || isAdmin;
  const resolved = c.status === "resolved";
  const minutesOpen = (Date.now() - c.createdAt.getTime()) / 60_000;
  const escalationUnlocked = !resolved && !c.firstVetCheckInAt && minutesOpen >= ESCALATION_MINUTES;

  return {
    mine,
    isReporter,
    isAdmin,
    isActiveResponder,
    isParticipant,
    canPostUpdate: !resolved && isParticipant,
    canResolve: !resolved && (isReporter || isAdmin || mine?.status === "checked_in"),
    canEscalate: escalationUnlocked && isParticipant,
    escalationUnlocked,
    minutesUntilEscalation: Math.max(0, Math.ceil(ESCALATION_MINUTES - minutesOpen)),
    canFileTreatment: user?.role === "vet" && user.isVerifiedVet && mine?.role === "vet" && mine.status !== "left",
    canAddExpense: isParticipant,
  };
}

export type ViewerContext = ReturnType<typeof viewerContext>;
