"use client";

import { Heart, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { donateAction } from "@/actions/donations";
import { FormError, FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import { CURRENCY, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRESETS = CURRENCY === "lkr" ? [500, 1000, 2500, 5000, 10000] : [5, 10, 25, 50, 100];

export function DonateForm({
  caseId,
  defaultName,
  compact = false,
}: {
  caseId?: string;
  defaultName?: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(donateAction, initialActionState);
  const [amount, setAmount] = useState(CURRENCY === "lkr" ? "1000" : "25");
  const [anonymous, setAnonymous] = useState(false);
  const fe = state.fieldErrors ?? {};
  const numeric = Number(amount);

  return (
    <form action={formAction} className="space-y-3">
      {caseId && <input type="hidden" name="caseId" value={caseId} />}
      <input type="hidden" name="isAnonymous" value={anonymous ? "true" : "false"} />

      <div className="grid grid-cols-5 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(String(p))}
            className={cn(
              "rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-muted",
              Number(amount) === p && "border-primary bg-primary/10 text-primary",
            )}
          >
            {formatMoney(p * 100)}
          </button>
        ))}
      </div>
      <FormField label={`Amount (${CURRENCY.toUpperCase()})`} htmlFor={`amount-${caseId ?? "general"}`} error={fe.amount}>
        <Input
          id={`amount-${caseId ?? "general"}`}
          name="amount"
          type="number"
          min={CURRENCY === "lkr" ? 200 : 1}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </FormField>
      {!compact && (
        <>
          <FormField label="Your name (shown on the case)" htmlFor="donorName" error={fe.donorName}>
            <Input id="donorName" name="donorName" defaultValue={defaultName} disabled={anonymous} />
          </FormField>
          <FormField label="Message (optional)" htmlFor="message" error={fe.message}>
            <Textarea id="message" name="message" rows={2} placeholder="Get well soon!" />
          </FormField>
        </>
      )}
      {compact && defaultName && <input type="hidden" name="donorName" value={defaultName} />}
      <Label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} />
        Donate anonymously
      </Label>
      <FormError message={state.error} />
      <Button type="submit" className="w-full" size="lg" disabled={pending || !(numeric >= 1)}>
        {pending ? <Loader2 className="animate-spin" /> : <Heart />}
        Donate {numeric >= 1 ? formatMoney(Math.round(numeric * 100)) : ""}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Secure payment by Stripe. Spending is published with receipts.</p>
    </form>
  );
}
