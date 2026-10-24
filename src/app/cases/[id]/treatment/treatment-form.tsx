"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { createTreatmentAction } from "@/actions/treatment";
import { TagPicker } from "@/components/cases/tag-picker";
import { FormError, FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Medication } from "@/db/schema";
import { initialActionState } from "@/lib/action-state";
import { OUTCOME_LABELS, OUTCOMES } from "@/lib/constants";

const emptyMed: Medication = { name: "", dose: "", route: "", frequency: "" };

export function TreatmentForm({ caseId, initialTags }: { caseId: string; initialTags: string[] }) {
  const [state, formAction, pending] = useActionState(createTreatmentAction, initialActionState);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [meds, setMeds] = useState<Medication[]>([{ ...emptyMed }]);
  const [outcome, setOutcome] = useState("ongoing");
  const fe = state.fieldErrors ?? {};

  const setMed = (i: number, patch: Partial<Medication>) =>
    setMeds((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const filledMeds = meds
    .filter((m) => m.name.trim())
    .map((m) => ({ ...m, durationDays: m.durationDays || undefined }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="injuryTags" value={JSON.stringify(tags)} />
      <input type="hidden" name="medications" value={JSON.stringify(filledMeds)} />
      <input type="hidden" name="outcome" value={outcome} />

      <FormField label="Diagnosis" htmlFor="diagnosis" error={fe.diagnosis}>
        <Input id="diagnosis" name="diagnosis" placeholder="e.g. Compound fracture of the left femur" />
      </FormField>

      <FormField label="Injury tags (used to match future cases)" error={fe.injuryTags}>
        <TagPicker value={tags} onChange={setTags} />
      </FormField>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Medications</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setMeds((m) => [...m, { ...emptyMed }])}>
            <Plus /> Add
          </Button>
        </div>
        {meds.map((m, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border p-2 sm:grid-cols-[1.4fr_1fr_1fr_1.2fr_80px_auto]">
            <Input placeholder="Drug" value={m.name} onChange={(e) => setMed(i, { name: e.target.value })} />
            <Input placeholder="Dose" value={m.dose} onChange={(e) => setMed(i, { dose: e.target.value })} />
            <Input placeholder="Route" value={m.route} onChange={(e) => setMed(i, { route: e.target.value })} />
            <Input placeholder="Frequency" value={m.frequency} onChange={(e) => setMed(i, { frequency: e.target.value })} />
            <Input
              placeholder="Days"
              type="number"
              min={0}
              value={m.durationDays ?? ""}
              onChange={(e) => setMed(i, { durationDays: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove medication"
              onClick={() => setMeds((prev) => prev.filter((_, j) => j !== i))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        {fe.medications && <p className="text-sm text-destructive">Each medication needs a drug, dose, route and frequency.</p>}
      </div>

      <FormField label="Procedures performed" htmlFor="procedures" error={fe.procedures}>
        <Textarea id="procedures" name="procedures" rows={3} placeholder="Cleaning, suturing, splinting, fluids…" />
      </FormField>
      <FormField label="Notes for follow-up care" htmlFor="notes" error={fe.notes}>
        <Textarea id="notes" name="notes" rows={3} placeholder="Dressing schedule, feeding, warning signs to watch for…" />
      </FormField>

      <FormField label="Outcome so far" error={fe.outcome} hint="Choose 'Ongoing' if treatment continues. Closing the case is a separate step.">
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ongoing">Ongoing treatment</SelectItem>
            {OUTCOMES.map((o) => (
              <SelectItem key={o} value={o}>
                {OUTCOME_LABELS[o]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Save treatment report
      </Button>
    </form>
  );
}
