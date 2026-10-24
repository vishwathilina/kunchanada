"use client";

import { CircleCheckBig, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { resolveCaseAction } from "@/actions/responders";
import { FormError, FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { OUTCOME_LABELS, OUTCOMES } from "@/lib/constants";

export function ResolveDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await resolveCaseAction(prev, fd);
    if (res.ok) {
      setOpen(false);
      if (res.message) toast.success(res.message);
    }
    return res;
  }, initialActionState);
  const fe = state.fieldErrors ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <CircleCheckBig /> Close case & publish outcome
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>How did it end?</DialogTitle>
            <DialogDescription>
              The outcome is shown publicly so the reporter, donors, and community know what happened.
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="caseId" value={caseId} />
          <FormField label="Outcome" error={fe.outcome}>
            <RadioGroup name="outcome" defaultValue="recovered" className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((o) => (
                <Label
                  key={o}
                  htmlFor={`outcome-${o}`}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm font-normal has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem id={`outcome-${o}`} value={o} />
                  {OUTCOME_LABELS[o]}
                </Label>
              ))}
            </RadioGroup>
          </FormField>
          <FormField label="What happened?" htmlFor="outcomeNote" error={fe.outcomeNote}>
            <Textarea
              id="outcomeNote"
              name="outcomeNote"
              rows={3}
              placeholder="e.g. Treated for 2 weeks, fully recovered and released back to his area."
            />
          </FormField>
          <FormError message={state.error} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Publish outcome
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
