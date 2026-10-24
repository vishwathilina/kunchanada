"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { claimSlotAction, declineCaseAction } from "@/actions/responders";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";
import type { NotificationItem, NotificationViewer } from "./use-notifications";

export function CaseInvite({
  item,
  viewer,
  onDone,
}: {
  item: NotificationItem;
  viewer?: NotificationViewer;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const qc = useQueryClient();
  const open = item.type === "new_case_nearby" && item.caseId && !item.response && viewer;

  function run(action: () => Promise<ActionState>, then?: () => void) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(res.message);
        await qc.invalidateQueries({ queryKey: ["notifications"] });
        onDone?.();
        then?.();
        router.refresh();
      } else if (res.message) toast.error(res.message);
    });
  }

  if (!open || !item.caseId || !viewer) return null;

  const slot = viewer.role === "vet" ? "vet" : "volunteer";

  return (
    <div className="mt-2 flex gap-2">
      <Button
        size="sm"
        className="h-10 bg-[#5c6b54] text-[#eeecea]"
        disabled={pending || (slot === "vet" && !viewer.verified)}
        onClick={() =>
          run(
            () => claimSlotAction(item.caseId!, slot),
            () => router.push(`/profile/${viewer.id}?tab=cases`),
          )
        }
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-10"
        disabled={pending}
        onClick={() => run(() => declineCaseAction(item.caseId!))}
      >
        Reject
      </Button>
    </div>
  );
}
