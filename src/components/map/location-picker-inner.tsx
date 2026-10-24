"use client";

import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import { useEffect } from "react";
import { Circle, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { SafeMapContainer } from "./safe-map";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import { pickerIcon } from "./leaflet-icons";
import { MapSizeFix } from "./map-size-fix";

export type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  radiusKm?: number;
  height?: number;
};

function ClickHandler({ onChange }: { onChange: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 14));
  }, [map, value]);
  return null;
}

export default function LocationPickerInner({ value, onChange, radiusKm, height = 320 }: Props) {
  const center: [number, number] = value ? [value.lat, value.lng] : DEFAULT_MAP_CENTER;
  return (
    <SafeMapContainer
      center={center}
      zoom={value ? 15 : DEFAULT_MAP_ZOOM}
      style={{ height, width: "100%" }}
      className="z-0 rounded-lg border"
    >
      <MapSizeFix />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      <Recenter value={value} />
      {value && (
        <>
          <Marker
            position={[value.lat, value.lng]}
            icon={pickerIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const ll = (e.target as L.Marker).getLatLng();
                onChange({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
          {radiusKm ? (
            <Circle
              center={[value.lat, value.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#3f6b4e", fillOpacity: 0.1, weight: 1.5 }}
            />
          ) : null}
        </>
      )}
    </SafeMapContainer>
  );
}
