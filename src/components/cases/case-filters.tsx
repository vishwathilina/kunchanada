"use client";

import { Crosshair, Home, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEVERITIES, SEVERITY_META, SPECIES } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CaseFilterValues = {
  scope: string;
  severity?: string;
  species?: string;
  near?: string;
  lat?: string;
  lng?: string;
  r?: string;
};

const ALL = "__all";

export function CaseFilters({ values, hasHome }: { values: CaseFilterValues; hasHome: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const update = (patch: Partial<CaseFilterValues>) => {
    const next = { ...values, ...patch };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v && v !== ALL && !(k === "scope" && v === "open")) params.set(k, v);
    }
    startTransition(() => router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false }));
  };

  const locateHere = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) =>
        update({
          near: "here",
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
          r: values.r ?? "15",
        }),
      () => toast.error("Couldn't get your location."),
    );
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2 transition-opacity", pending && "opacity-60")}>
      <div className="inline-flex rounded-lg border p-0.5">
        {(["open", "resolved", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => update({ scope: s })}
            className={cn(
              "rounded-md px-3 py-1 text-sm capitalize",
              values.scope === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "open" ? "Needs help" : s}
          </button>
        ))}
      </div>

      <Select value={values.severity ?? ALL} onValueChange={(v) => update({ severity: v })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any severity</SelectItem>
          {SEVERITIES.map((s) => (
            <SelectItem key={s} value={s}>
              {SEVERITY_META[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.species ?? ALL} onValueChange={(v) => update({ species: v })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Species" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any animal</SelectItem>
          {SPECIES.map((s) => (
            <SelectItem key={s} value={s}>
              {titleCase(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {values.near ? (
        <>
          <Select value={values.r ?? "15"} onValueChange={(v) => update({ r: v })}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["5", "10", "15", "25", "50", "100"].map((r) => (
                <SelectItem key={r} value={r}>
                  {r} km
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update({ near: undefined, lat: undefined, lng: undefined, r: undefined })}
          >
            <X /> {values.near === "home" ? "My area" : "Near me"}
          </Button>
        </>
      ) : (
        <>
          {hasHome && (
            <Button variant="outline" size="sm" onClick={() => update({ near: "home", r: values.r ?? "15" })}>
              <Home /> My area
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={locateHere}>
            <Crosshair /> Near me
          </Button>
        </>
      )}
    </div>
  );
}
