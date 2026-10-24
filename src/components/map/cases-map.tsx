"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { CasesMapProps } from "./cases-map-inner";

const CasesMapInner = dynamic(() => import("./cases-map-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full rounded-xl" />,
});

export type { MapCase } from "./cases-map-inner";

export function CasesMap(props: CasesMapProps) {
  return <CasesMapInner {...props} />;
}
