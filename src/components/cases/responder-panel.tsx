"use client";

import { BadgeCheck, CheckCircle2, HandHelping, Loader2, LogOut, MapPinCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { checkInAction, claimSlotAction, declineCaseAction, leaveCaseAction, verifyCaseAction } from "@/actions/responders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ActionState } from "@/lib/action-state";

type Props = {
  caseId: string;
  resolved: boolean;
  verified: boolean;
  signedIn: boolean;
  isReporter: boolean;
  viewerRole: string | null;
  viewerIsVerifiedVet: boolean;
  myStatus: "claimed" | "checked_in" | "left" | null;
  myRole: "volunteer" | "vet" | null;
  volunteers: number;
  maxVolunteers: number;
  vets: number;
  maxVets: number;
};

export function ResponderPanel(p: Props) {
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else if (res.message) toast.success(res.message);
    });

  const volunteersFull = p.volunteers >= p.maxVolunteers;
  const vetsFull = p.vets >= p.maxVets;
  const active = p.myStatus === "claimed" || p.myStatus === "checked_in";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHelping className="size-5 text-primary" /> Responders
        </CardTitle>
        <CardDescription>
          Slots are limited so help spreads across every animal that needs it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Volunteers</span>
              <span className="font-medium">
                {p.volunteers}/{p.maxVolunteers}
              </span>
            </div>
            <Progress value={(p.volunteers / p.maxVolunteers) * 100} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Vets</span>
              <span className="font-medium">
                {p.vets}/{p.maxVets}
              </span>
            </div>
            <Progress value={(p.vets / p.maxVets) * 100} className="h-2" />
          </div>
        </div>

        {p.resolved ? (
          <p className="text-sm text-muted-foreground">This case is closed.</p>
        ) : !p.signedIn ? (
          <Button asChild className="w-full">
            <Link href="/login">Sign in to help</Link>
          </Button>
        ) : active ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
              {p.myStatus === "checked_in" ? (
                <>
                  <CheckCircle2 className="size-4 text-green-600" /> You&apos;re on site as a {p.myRole}.
                </>
              ) : (
                <>
                  <HandHelping className="size-4 text-primary" /> You claimed a {p.myRole} slot.
                </>
              )}
            </div>
            {p.myStatus === "claimed" && (
              <Button className="w-full" disabled={pending} onClick={() => run(() => checkInAction(p.caseId))}>
                {pending ? <Loader2 className="animate-spin" /> : <MapPinCheck />} I&apos;ve arrived — check in
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              disabled={pending}
              onClick={() => run(() => leaveCaseAction(p.caseId))}
            >
              <LogOut /> I can&apos;t help anymore
            </Button>
          </div>
        ) : p.viewerRole === "vet" ? (
          <div className="grid gap-2">
            <Button
              disabled={pending || vetsFull || !p.viewerIsVerifiedVet}
              onClick={() => run(() => claimSlotAction(p.caseId, "vet"))}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Stethoscope />}
              {!p.viewerIsVerifiedVet ? "Vet verification pending" : vetsFull ? "Vet slot taken" : "Accept — I'll treat this"}
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => run(() => declineCaseAction(p.caseId))}>
              Reject
            </Button>
          </div>
        ) : (
          <Button disabled={pending || volunteersFull} onClick={() => run(() => claimSlotAction(p.caseId, "volunteer"))}>
            {pending ? <Loader2 className="animate-spin" /> : <HandHelping />}
            {volunteersFull ? "Volunteer slots full" : "I can help — on my way"}
          </Button>
        )}

        {!p.resolved && p.signedIn && !p.verified && !p.isReporter && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={() => run(() => verifyCaseAction(p.caseId))}
          >
            <BadgeCheck /> I can see this animal — confirm report
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
