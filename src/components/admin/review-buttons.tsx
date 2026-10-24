"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  dismissFlagAction,
  hideFlaggedCaseAction,
  rejectVetAction,
  reviewExpenseAction,
  verifyVetAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function useAction(fn: () => Promise<{ ok?: boolean; error?: string; message?: string }>) {
  const [pending, start] = useTransition();
  return {
    pending,
    run: () =>
      start(async () => {
        const res = await fn();
        if (res.ok) toast.success(res.message);
        else toast.error(res.error ?? "Action failed.");
      }),
  };
}

export function VetReviewButtons({ userId }: { userId: string }) {
  const [reason, setReason] = useState("");
  const approve = useAction(() => verifyVetAction(userId));
  const reject = useAction(() => rejectVetAction(userId, reason));
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button size="sm" disabled={approve.pending} onClick={approve.run}>
          Approve
        </Button>
        <Button size="sm" variant="outline" disabled={reject.pending || reason.trim().length < 5} onClick={reject.run}>
          Decline
        </Button>
      </div>
      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason if declining"
        className="h-8 w-56"
      />
    </div>
  );
}

export function FlagReviewButtons({ flagId }: { flagId: string }) {
  const dismiss = useAction(() => dismissFlagAction(flagId));
  const hide = useAction(() => hideFlaggedCaseAction(flagId));
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={dismiss.pending} onClick={dismiss.run}>
        Dismiss
      </Button>
      <Button size="sm" variant="destructive" disabled={hide.pending} onClick={hide.run}>
        Hide case
      </Button>
    </div>
  );
}

export function ExpenseReviewButtons({ expenseId }: { expenseId: string }) {
  const approve = useAction(() => reviewExpenseAction(expenseId, "approved"));
  const reject = useAction(() => reviewExpenseAction(expenseId, "rejected"));
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={approve.pending} onClick={approve.run}>
        Approve
      </Button>
      <Button size="sm" variant="outline" disabled={reject.pending} onClick={reject.run}>
        Decline
      </Button>
    </div>
  );
}
