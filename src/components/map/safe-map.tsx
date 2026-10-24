"use client";

import { LeafletContext, createLeafletContext, type LeafletContextInterface } from "@react-leaflet/core";
import L from "leaflet";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * react-leaflet's MapContainer removes the map in an effect that React's strict
 * mode runs twice. Layers then call appendChild on a map that no longer has panes.
 * This waits until the div is mounted, then creates the map once.
 */
export function SafeMapContainer({
  center,
  zoom,
  className,
  style,
  scrollWheelZoom = true,
  children,
}: {
  center: [number, number];
  zoom: number;
  className?: string;
  style?: CSSProperties;
  scrollWheelZoom?: boolean;
  children?: ReactNode;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [context, setContext] = useState<LeafletContextInterface | null>(null);
  const view = useRef({ center, zoom, scrollWheelZoom });

  useEffect(() => {
    if (!node) return;
    let map: L.Map | null = null;
    const frame = requestAnimationFrame(() => {
      const el = node as HTMLDivElement & { _leaflet_id?: number };
      if (el._leaflet_id != null) return;
      const { center: c, zoom: z, scrollWheelZoom: wheel } = view.current;
      map = L.map(el, { scrollWheelZoom: wheel });
      map.setView(c, z);
      setContext(createLeafletContext(map));
    });
    return () => {
      cancelAnimationFrame(frame);
      map?.remove();
    };
  }, [node]);

  return (
    <div ref={setNode} className={className} style={style}>
      {context ? <LeafletContext value={context}>{children}</LeafletContext> : null}
    </div>
  );
}
