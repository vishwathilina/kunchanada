"use client";

import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";
import { Circle, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { SafeMapContainer } from "./safe-map";
import MarkerClusterGroup from "react-leaflet-cluster";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, SEVERITY_META, STATUS_LABELS, type CaseStatus, type Severity } from "@/lib/constants";
import { dotIcon, severityIcon } from "./leaflet-icons";
import { MapSizeFix } from "./map-size-fix";

export type MapCase = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  severity: Severity;
  status: CaseStatus;
  imageUrl: string | null;
};

export type CasesMapProps = {
  cases: MapCase[];
  center?: { lat: number; lng: number } | null;
  radiusKm?: number;
  height?: number | string;
};

function FitBounds({ cases, center }: { cases: MapCase[]; center?: CasesMapProps["center"] }) {
  const map = useMap();
  useEffect(() => {
    if (center) return;
    if (cases.length === 0) return;
    const bounds = L.latLngBounds(cases.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, cases, center]);
  return null;
}

const youIcon = dotIcon("#2563eb", 16);

export default function CasesMapInner({ cases, center, radiusKm, height = 420 }: CasesMapProps) {
  const initial: [number, number] = center ? [center.lat, center.lng] : DEFAULT_MAP_CENTER;
  return (
    <SafeMapContainer
      center={initial}
      zoom={center ? 12 : DEFAULT_MAP_ZOOM}
      style={{ height, width: "100%" }}
      className="z-0 rounded-xl border"
    >
      <MapSizeFix />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds cases={cases} center={center} />
      {center && (
        <>
          <Marker position={[center.lat, center.lng]} icon={youIcon}>
            <Popup>Your area</Popup>
          </Marker>
          {radiusKm ? (
            <Circle
              center={[center.lat, center.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#2563eb", fillOpacity: 0.04, weight: 1 }}
            />
          ) : null}
        </>
      )}
      <MarkerClusterGroup chunkedLoading>
        {cases.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={severityIcon(c.severity, c.status === "resolved")}>
            <Popup minWidth={200}>
              <div className="space-y-1.5">
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- Leaflet popups render outside React's image pipeline
                  <img src={c.imageUrl} alt="" className="h-24 w-full rounded object-cover" />
                )}
                <div className="text-sm font-semibold leading-tight">{c.title}</div>
                <div className="text-xs" style={{ color: SEVERITY_META[c.severity].color }}>
                  {SEVERITY_META[c.severity].label} · {STATUS_LABELS[c.status]}
                </div>
                <Link href={`/cases/${c.id}`} className="text-xs font-medium underline">
                  Open case →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </SafeMapContainer>
  );
}
