"use client";

import { Loader2, Send } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { postUpdateAction } from "@/actions/responders";
import { FormError } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";

export function UpdateForm({ caseId }: { caseId: string }) {
  const [state, formAction, pending] = useActionState(postUpdateAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="caseId" value={caseId} />
      <Textarea name="message" rows={2} placeholder="Post an update: condition, what you did, what's needed next…" />
      <FormError message={state.error} />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />} Post update
        </Button>
      </div>
    </form>
  );
}
