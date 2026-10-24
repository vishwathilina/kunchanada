"use client";

import { Loader2, Phone, Siren } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { escalateAction } from "@/actions/responders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKm } from "@/lib/format";
import type { NearbyVet } from "@/lib/geo";

type Props = {
  caseId: string;
  canEscalate: boolean;
  unlocked: boolean;
  minutesUntil: number;
  escalationMinutes: number;
  initialContacts: NearbyVet[] | null;
  escalationCount: number;
};

export function EmergencyPanel({
  caseId,
  canEscalate,
  unlocked,
  minutesUntil,
  escalationMinutes,
  initialContacts,
  escalationCount,
}: Props) {
  const [contacts, setContacts] = useState<NearbyVet[] | null>(initialContacts);
  const [pending, startTransition] = useTransition();

  const trigger = () =>
    startTransition(async () => {
      const res = await escalateAction(caseId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setContacts(res.contacts ?? []);
      toast.warning(res.message);
    });

  return (
    <Card className={unlocked ? "border-destructive/50 bg-destructive/5" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Siren className="size-5" /> Emergency
        </CardTitle>
        <CardDescription>
          {unlocked
            ? "No vet has checked in yet. Get direct numbers of verified vets nearby and alert our team."
            : `Unlocks if no vet checks in within ${escalationMinutes} minutes of the report (${minutesUntil} min left).`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {canEscalate && (
          <Button variant="destructive" className="w-full font-semibold" disabled={pending} onClick={trigger}>
            {pending ? <Loader2 className="animate-spin" /> : <Siren />}
            {contacts ? "Alert again & refresh contacts" : "Emergency — vet didn't show up"}
          </Button>
        )}
        {escalationCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Escalated {escalationCount} time{escalationCount > 1 ? "s" : ""}. Admins have been notified.
          </p>
        )}
        {contacts && (
          <ul className="space-y-2">
            {contacts.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No verified vets within range. Try a local animal hospital or helpline.
              </li>
            )}
            {contacts.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{v.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {v.clinicName ?? "Independent"} · {formatKm(v.distanceMeters)}
                    {!v.isAvailable && " · marked unavailable"}
                  </div>
                </div>
                {v.phone && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${v.phone.replace(/\s+/g, "")}`}>
                      <Phone /> Call
                    </a>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
