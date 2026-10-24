"use client";

import { Crosshair, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LatLng } from "./location-picker-inner";

const LocationPickerInner = dynamic(() => import("./location-picker-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] w-full rounded-lg" />,
});

export type { LatLng };

export type ReverseGeocode = { address?: string; city?: string };

async function reverseGeocode({ lat, lng }: LatLng): Promise<ReverseGeocode> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return {};
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };
    const a = data.address ?? {};
    return {
      address: data.display_name?.split(",").slice(0, 3).join(",").trim(),
      city: a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? a.state_district,
    };
  } catch {
    return {};
  }
}

type Props = {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  onGeocode?: (result: ReverseGeocode) => void;
  radiusKm?: number;
  height?: number;
};

export function LocationPicker({ value, onChange, onGeocode, radiusKm, height }: Props) {
  const [locating, setLocating] = useState(false);

  const handleChange = (v: LatLng) => {
    onChange(v);
    if (onGeocode) void reverseGeocode(v).then(onGeocode);
  };

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        handleChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location. Tap the map to place the pin instead.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {value
            ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)} — drag the pin to adjust`
            : "Tap the map to drop a pin, or use your current location."}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={locate} disabled={locating}>
          {locating ? <Loader2 className="animate-spin" /> : <Crosshair />}
          Use my location
        </Button>
      </div>
      <LocationPickerInner value={value} onChange={handleChange} radiusKm={radiusKm} height={height} />
    </div>
  );
}
