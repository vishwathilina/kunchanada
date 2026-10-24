import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export function pointSql(lat: number, lng: number) {
  return sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
}

export type NearbyVet = {
  id: string;
  name: string;
  phone: string | null;
  clinicName: string | null;
  distanceMeters: number;
  isAvailable: boolean;
};

/** Verified vets near a point, closest first. Used by the emergency escalation. */
export async function findVerifiedVetsNear(lat: number, lng: number, radiusKm: number, limit = 10) {
  const point = pointSql(lat, lng);
  const result = await db.execute<{
    id: string;
    name: string;
    phone: string | null;
    clinic_name: string | null;
    distance_m: number;
    is_available: boolean;
  }>(sql`
    SELECT u.id, u.name, u.phone, v.clinic_name, u.is_available,
           ST_Distance(u.location, ${point}) AS distance_m
    FROM users u
    JOIN vet_profiles v ON v.user_id = u.id
    WHERE u.role = 'vet'
      AND v.verified_at IS NOT NULL
      AND ST_DWithin(u.location, ${point}, ${radiusKm * 1000})
    ORDER BY u.is_available DESC, distance_m ASC
    LIMIT ${limit}
  `);
  return result.rows.map<NearbyVet>((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    clinicName: r.clinic_name,
    distanceMeters: Number(r.distance_m),
    isAvailable: r.is_available,
  }));
}
