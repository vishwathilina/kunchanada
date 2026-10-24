import { formatDistanceToNowStrict } from "date-fns";

export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY ?? "usd").toLowerCase();

export function formatMoney(cents: number, currency = CURRENCY) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

export function formatKm(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function titleCase(s: string) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
