"use client";

import { Flag, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { flagCaseAction } from "@/actions/cases";
import { FormError } from "@/components/form-field";
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
import { Textarea } from "@/components/ui/textarea";
import { initialActionState, type ActionState } from "@/lib/action-state";

export function FlagDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await flagCaseAction(prev, fd);
    if (res.ok) {
      setOpen(false);
      if (res.message) toast.success(res.message);
    }
    return res;
  }, initialActionState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag /> Report a problem
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Flag this case</DialogTitle>
            <DialogDescription>Fake, duplicate, or inappropriate? Our moderators will take a look.</DialogDescription>
          </DialogHeader>
          <input type="hidden" name="caseId" value={caseId} />
          <Textarea name="reason" rows={3} placeholder="What's wrong with this report?" />
          <FormError message={state.error ?? state.fieldErrors?.reason?.[0]} />
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Submit flag
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
