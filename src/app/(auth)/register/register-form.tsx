"use client";

import { ArrowLeft, ArrowRight, HandHeart, Loader2, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction } from "@/actions/auth";
import { FormError, FormField } from "@/components/form-field";
import { LocationPicker, type LatLng } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

type Role = "volunteer" | "vet";

const STEP_FIELDS: Record<number, string[]> = {
  0: ["role", "name", "email", "password"],
  1: ["lat", "lng", "city", "phone", "serviceRadiusKm"],
  2: ["licenseNumber", "clinicName"],
};

export function RegisterForm() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("volunteer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [radius, setRadius] = useState(10);
  const [license, setLicense] = useState("");
  const [clinic, setClinic] = useState("");
  const [localError, setLocalError] = useState<string>();
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await registerAction(prev, fd);
    if (res.fieldErrors) {
      const errored = Object.keys(res.fieldErrors);
      const target = [0, 1, 2].find((s) => STEP_FIELDS[s]!.some((f) => errored.includes(f)));
      if (target !== undefined) setStep(target);
    }
    return res;
  }, initialActionState);

  const lastStep = role === "vet" ? 2 : 1;
  const fe = state.fieldErrors ?? {};

  const validateStep = (s: number): string | undefined => {
    if (s === 0) {
      if (name.trim().length < 2) return "Enter your name.";
      if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email.";
      if (password.length < 8) return "Password must be at least 8 characters.";
    }
    if (s === 1) {
      if (!location) return "Pick your location on the map.";
      if (city.trim().length < 2) return "Enter your city.";
      if (phone.trim().length < 6) return "Enter a phone number so responders can coordinate.";
    }
    if (s === 2 && license.trim().length === 0) return "Enter your veterinary license number.";
  };

  const next = () => {
    const err = validateStep(step);
    setLocalError(err);
    if (!err) setStep((s) => s + 1);
  };

  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={(e) => {
        if (step < lastStep) {
          e.preventDefault();
          next();
          return;
        }
        const err = validateStep(step);
        if (err) {
          e.preventDefault();
          setLocalError(err);
        }
      }}
    >
      <ol className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {["Account", "Location", ...(role === "vet" ? ["Vet details"] : [])].map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border",
                i <= step && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {i + 1}
            </span>
            <span className={cn(i === step && "text-foreground")}>{label}</span>
            {i < lastStep && <span className="mx-1 h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>

      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="lat" value={location?.lat ?? ""} />
      <input type="hidden" name="lng" value={location?.lng ?? ""} />
      <input type="hidden" name="serviceRadiusKm" value={radius} />

      <section className={cn("space-y-4", step !== 0 && "hidden")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { value: "volunteer", title: "Volunteer", text: "Report animals, help on the ground, donate.", Icon: HandHeart },
              { value: "vet", title: "Veterinarian", text: "Treat animals near you. License verified by our team.", Icon: Stethoscope },
            ] as const
          ).map(({ value, title, text, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors hover:bg-muted",
                role === value && "border-primary bg-primary/5 ring-2 ring-primary/30",
              )}
            >
              <Icon className="mb-2 size-5 text-primary" />
              <div className="font-medium">{title}</div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </button>
          ))}
        </div>
        <FormField label="Full name" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </FormField>
        <FormField label="Email" htmlFor="email" error={fe.email}>
          <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </FormField>
        <FormField label="Password" htmlFor="password" error={fe.password} hint="At least 8 characters.">
          <Input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </FormField>
      </section>

      <section className={cn("space-y-4", step !== 1 && "hidden")}>
        <FormField label="Where are you based?" error={fe.lat} hint="We only alert you about animals inside your radius.">
          {step === 1 ? (
            <LocationPicker
              value={location}
              onChange={setLocation}
              radiusKm={radius}
              onGeocode={(g) => {
                if (g.city && !city) setCity(g.city);
              }}
            />
          ) : (
            <div className="h-[320px] rounded-lg border bg-muted/40" />
          )}
        </FormField>
        <FormField label={`Alert radius: ${radius} km`}>
          <Slider value={[radius]} min={1} max={50} step={1} onValueChange={([v]) => setRadius(v ?? 10)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="City" htmlFor="city" error={fe.city}>
            <Input id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={fe.phone} hint="Only shared with responders on your cases.">
            <Input id="phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </FormField>
        </div>
      </section>

      <section className={cn("space-y-4", step !== 2 && "hidden")}>
        <p className="text-sm text-muted-foreground">
          An admin will verify your license before you can claim vet slots or appear in emergency contacts. You can upload
          your license document from your dashboard after signing up.
        </p>
        <FormField label="License number" htmlFor="licenseNumber" error={fe.licenseNumber}>
          <Input id="licenseNumber" name="licenseNumber" value={license} onChange={(e) => setLicense(e.target.value)} />
        </FormField>
        <FormField label="Clinic / hospital (optional)" htmlFor="clinicName" error={fe.clinicName}>
          <Input id="clinicName" name="clinicName" value={clinic} onChange={(e) => setClinic(e.target.value)} />
        </FormField>
      </section>

      <FormError message={localError ?? state.error} />

      <div className="flex items-center justify-between gap-2">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft /> Back
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
        {step < lastStep ? (
          <Button type="button" onClick={next} size="lg">
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Create account
          </Button>
        )}
      </div>
    </form>
  );
}
