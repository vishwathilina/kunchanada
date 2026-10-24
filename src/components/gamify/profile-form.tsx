"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { updateProfileAction } from "@/actions/profile";
import { FormError, FormField } from "@/components/form-field";
import { LocationPicker, type LatLng } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";

type Props = {
  name: string;
  phone: string;
  city: string;
  bio: string;
  lat: number;
  lng: number;
  serviceRadiusKm: number;
};

export function ProfileForm(props: Props) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialActionState);
  const [location, setLocation] = useState<LatLng>({ lat: props.lat, lng: props.lng });
  const [city, setCity] = useState(props.city);
  const [radius, setRadius] = useState(props.serviceRadiusKm);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="lat" value={location.lat} />
      <input type="hidden" name="lng" value={location.lng} />
      <input type="hidden" name="serviceRadiusKm" value={radius} />
      <FormField label="Name" htmlFor="name" error={fe.name}>
        <Input id="name" name="name" defaultValue={props.name} autoComplete="name" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Phone" htmlFor="phone" error={fe.phone}>
          <Input id="phone" name="phone" type="tel" defaultValue={props.phone} autoComplete="tel" />
        </FormField>
        <FormField label="City" htmlFor="city" error={fe.city}>
          <Input id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
        </FormField>
      </div>
      <FormField label="Bio" htmlFor="bio" error={fe.bio} hint="Shown on your public profile.">
        <Textarea id="bio" name="bio" defaultValue={props.bio} rows={3} maxLength={500} />
      </FormField>
      <FormField label="Home base" error={fe.lat} hint="Used to alert you about animals nearby.">
        <LocationPicker
          value={location}
          onChange={setLocation}
          radiusKm={radius}
          onGeocode={(g) => {
            if (g.city) setCity(g.city);
          }}
        />
      </FormField>
      <FormField label={`Alert radius: ${radius} km`}>
        <Slider value={[radius]} min={1} max={50} step={1} onValueChange={([v]) => setRadius(v ?? 10)} />
      </FormField>
      <FormError message={state.error} />
      {state.ok && state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Save profile
      </Button>
    </form>
  );
}
