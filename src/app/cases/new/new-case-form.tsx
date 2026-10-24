"use client";

import { Loader2, Send } from "lucide-react";
import { useActionState, useState } from "react";
import { createCaseAction } from "@/actions/cases";
import { TagPicker } from "@/components/cases/tag-picker";
import { FormError, FormField } from "@/components/form-field";
import { LocationPicker, type LatLng } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader, type UploadedImage } from "@/components/uploads/image-uploader";
import { initialActionState } from "@/lib/action-state";
import { SEVERITIES, SEVERITY_META, SPECIES, type Severity } from "@/lib/constants";
import { CURRENCY, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NewCaseForm({ defaultCity }: { defaultCity: string }) {
  const [state, formAction, pending] = useActionState(createCaseAction, initialActionState);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [species, setSpecies] = useState<string>("dog");
  const [severity, setSeverity] = useState<Severity>("urgent");
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(defaultCity);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="imageUrls" value={JSON.stringify(images.map((i) => i.url))} />
      <input type="hidden" name="imageKeys" value={JSON.stringify(images.map((i) => i.key ?? ""))} />
      <input type="hidden" name="species" value={species} />
      <input type="hidden" name="severity" value={severity} />
      <input type="hidden" name="injuryTags" value={JSON.stringify(tags)} />
      <input type="hidden" name="lat" value={location?.lat ?? ""} />
      <input type="hidden" name="lng" value={location?.lng ?? ""} />

      <section className="space-y-3">
        <h2 className="font-semibold">1. Photos</h2>
        <FormField label="Clear photos help vets judge the injury before they arrive" error={fe.imageUrls}>
          <ImageUploader value={images} onChange={setImages} />
        </FormField>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">2. What&apos;s wrong?</h2>
        <FormField label="How urgent is it?" error={fe.severity}>
          <div className="grid gap-2 sm:grid-cols-3">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors hover:bg-muted",
                  severity === s && "ring-2 ring-offset-1",
                )}
                style={severity === s ? { borderColor: SEVERITY_META[s].color, ["--tw-ring-color" as string]: SEVERITY_META[s].color } : undefined}
              >
                <div className="flex items-center gap-2 font-medium">
                  <span className="size-2.5 rounded-full" style={{ background: SEVERITY_META[s].color }} />
                  {SEVERITY_META[s].label}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{SEVERITY_META[s].description}</p>
              </button>
            ))}
          </div>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <FormField label="Animal" error={fe.species}>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPECIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {titleCase(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Short title" htmlFor="title" error={fe.title}>
            <Input id="title" name="title" placeholder="e.g. Dog hit by a car near the market" maxLength={120} />
          </FormField>
        </div>
        <FormField label="Describe the animal and its condition" htmlFor="description" error={fe.description}>
          <Textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Is it conscious? Bleeding? Can it walk? Is it in a dangerous spot? Anything a responder should know."
          />
        </FormField>
        <FormField label="What do you see? (optional, helps match past treatments)" error={fe.injuryTags}>
          <TagPicker value={tags} onChange={setTags} />
        </FormField>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">3. Where is the animal?</h2>
        <FormField label="Location" error={fe.lat}>
          <LocationPicker
            value={location}
            onChange={setLocation}
            onGeocode={(g) => {
              if (g.address) setAddress(g.address);
              if (g.city) setCity(g.city);
            }}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Landmark / address" htmlFor="addressText" error={fe.addressText}>
            <Input
              id="addressText"
              name="addressText"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Near the bus stop, opposite the temple…"
            />
          </FormField>
          <FormField label="City" htmlFor="city" error={fe.city}>
            <Input id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">4. Help needed</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Volunteers needed" htmlFor="maxVolunteers" error={fe.maxVolunteers} hint="Stops alerting once full.">
            <Input id="maxVolunteers" name="maxVolunteers" type="number" min={1} max={10} defaultValue={3} />
          </FormField>
          <FormField label="Vets needed" htmlFor="maxVets" error={fe.maxVets}>
            <Input id="maxVets" name="maxVets" type="number" min={1} max={3} defaultValue={1} />
          </FormField>
          <FormField
            label={`Funding goal (${CURRENCY.toUpperCase()})`}
            htmlFor="fundingGoal"
            error={fe.fundingGoal}
            hint="0 if no funds are needed yet."
          >
            <Input id="fundingGoal" name="fundingGoal" type="number" min={0} step="1" defaultValue={0} />
          </FormField>
        </div>
      </section>

      <FormError message={state.error} />
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        Send alert to nearby responders
      </Button>
    </form>
  );
}
