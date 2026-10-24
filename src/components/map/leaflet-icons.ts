import L from "leaflet";
import { SEVERITY_META, type Severity } from "@/lib/constants";

export function dotIcon(color: string, size = 22) {
  return L.divIcon({
    className: "",
    html: `<div class="case-marker" style="width:${size}px;height:${size}px;background:${color}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function severityIcon(severity: Severity, resolved = false) {
  return dotIcon(resolved ? "#6b7280" : SEVERITY_META[severity].color, resolved ? 16 : 22);
}

export const pickerIcon = dotIcon("#3f6b4e", 26);
