"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Leaflet measures its box once. Hidden steps and late layout leave a gray strip until we remeasure. */
export function MapSizeFix() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const fix = () => {
      if (!container.isConnected || !map.getPane("mapPane")) return;
      map.invalidateSize();
    };
    fix();
    const observer = new ResizeObserver(fix);
    observer.observe(container);
    if (container.parentElement) observer.observe(container.parentElement);
    const timers = [50, 300, 1000].map((ms) => window.setTimeout(fix, ms));
    return () => {
      observer.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [map]);
  return null;
}
