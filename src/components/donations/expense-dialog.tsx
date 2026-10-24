"use client";

import { Loader2, Receipt } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { addExpenseAction } from "@/actions/donations";
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
import { Input } from "@/components/ui/input";
import { FileUploadButton } from "@/components/uploads/file-upload-button";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { CURRENCY } from "@/lib/format";

export function ExpenseDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await addExpenseAction(prev, fd);
    if (res.ok) {
      setOpen(false);
      setReceipt(null);
      if (res.message) toast.success(res.message);
    }
    return res;
  }, initialActionState);
  const fe = state.fieldErrors ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Receipt /> Log an expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Log an expense</DialogTitle>
            <DialogDescription>
              Vet bills, medicine, transport. An admin approves it before it counts as spent, and the receipt is shown
              publicly.
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="caseId" value={caseId} />
          <input type="hidden" name="receiptUrl" value={receipt ?? ""} />
          <FormField label={`Amount (${CURRENCY.toUpperCase()})`} htmlFor="expense-amount" error={fe.amount}>
            <Input id="expense-amount" name="amount" type="number" min={0.01} step="0.01" />
          </FormField>
          <FormField label="What was it for?" htmlFor="expense-description" error={fe.description}>
            <Input id="expense-description" name="description" placeholder="Antibiotics and dressing" />
          </FormField>
          <FormField label="Receipt" error={fe.receiptUrl}>
            <FileUploadButton endpoint="receipt" value={receipt} onChange={setReceipt} label="Upload receipt" />
          </FormField>
          <FormError message={state.error} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Submit expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
