"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { createTreatmentAction } from "@/actions/treatment";
import { TagPicker } from "@/components/cases/tag-picker";
import { FormError, FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Medication } from "@/db/schema";
import { initialActionState } from "@/lib/action-state";

const emptyMed: Medication = { name: "", dose: "", route: "", frequency: "" };

export function CompleteTreatment({ caseId, initialTags }: { caseId: string; initialTags: string[] }) {
  const [state, formAction, pending] = useActionState(createTreatmentAction, initialActionState);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [med, setMed] = useState<Medication>({ ...emptyMed });
  const fe = state.fieldErrors ?? {};
  const medications =
    med.name.trim() && med.dose.trim() && med.route.trim() && med.frequency.trim()
      ? [{ ...med, durationDays: med.durationDays || undefined }]
      : [];

  return (
    <form action={formAction} className="space-y-5 bg-[#e4e1dd] p-5 sm:p-7">
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="complete" value="1" />
      <input type="hidden" name="outcome" value="recovered" />
      <input type="hidden" name="injuryTags" value={JSON.stringify(tags)} />
      <input type="hidden" name="medications" value={JSON.stringify(medications)} />

      <div>
        <h3 className="text-2xl tracking-[-0.04em] text-[#333231]">Treatment complete</h3>
        <p className="mt-1 text-base text-[#6b6763]">
          Medications and procedures are optional. What you write here is what the next similar case is matched against.
        </p>
      </div>

      <FormError message={state.message} />

      <FormField label="What you treated" htmlFor="diagnosis" error={fe.diagnosis}>
        <Textarea id="diagnosis" name="diagnosis" placeholder="What you found and what you did" />
      </FormField>

      <FormField label="Injury tags" hint="Leave the ones that fit. Matching uses these." error={fe.injuryTags}>
        <TagPicker value={tags} onChange={setTags} />
      </FormField>

      <FormField label="Medication" hint="Optional. Fill the drug, dose, route, and how often, or leave it blank.">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Drug" value={med.name} onChange={(e) => setMed({ ...med, name: e.target.value })} />
          <Input placeholder="Dose" value={med.dose} onChange={(e) => setMed({ ...med, dose: e.target.value })} />
          <Input placeholder="Route" value={med.route} onChange={(e) => setMed({ ...med, route: e.target.value })} />
          <Input placeholder="How often" value={med.frequency} onChange={(e) => setMed({ ...med, frequency: e.target.value })} />
        </div>
      </FormField>

      <FormField label="Procedures" htmlFor="procedures" hint="Optional." error={fe.procedures}>
        <Textarea id="procedures" name="procedures" placeholder="Wound clean, splint, fluids…" />
      </FormField>

      <Button type="submit" disabled={pending} className="h-14 w-full bg-[#5c6b54] text-[#eeecea]">
        {pending && <Loader2 className="animate-spin" />}
        Completed
      </Button>
    </form>
  );
}
