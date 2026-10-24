"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setAvailabilityAction } from "@/actions/profile";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function AvailabilityToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
      <div>
        <Label htmlFor="available">Available for nearby alerts</Label>
        <p className="text-xs text-muted-foreground">
          {on ? "We'll ping you when an animal is reported inside your radius." : "Alerts are paused."}
        </p>
      </div>
      <Switch
        id="available"
        checked={on}
        disabled={pending}
        onCheckedChange={(next) => {
          const prev = on;
          setOn(next);
          start(async () => {
            const res = await setAvailabilityAction(next);
            if (res.ok) toast.success(res.message);
            else {
              setOn(prev);
              toast.error(res.error ?? "Could not update availability.");
            }
          });
        }}
      />
    </div>
  );
}
