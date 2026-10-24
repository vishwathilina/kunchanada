import { z } from "zod";
import { INJURY_TAGS, OUTCOMES, SEVERITIES, SPECIES } from "./constants";

const lat = z.coerce.number().min(-90, "Pick a location on the map").max(90);
const lng = z.coerce.number().min(-180, "Pick a location on the map").max(180);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** Accepts a JSON-encoded string array from a hidden input (e.g. tag pickers, uploaded URLs). */
const jsonStringArray = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return [] as string[];
    try {
      const parsed: unknown = JSON.parse(v);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed as string[];
    } catch {}
    ctx.addIssue({ code: "custom", message: "Invalid list" });
    return z.NEVER;
  });

const injuryTags = jsonStringArray.pipe(z.array(z.enum(INJURY_TAGS)).max(8));

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    email: z.email("Enter a valid email").trim().toLowerCase(),
    password: z.string().min(8, "Use at least 8 characters").max(128),
    role: z.enum(["volunteer", "vet"]),
    phone: z.string().trim().min(6, "Enter a phone number").max(30),
    city: z.string().trim().min(2, "Enter your city").max(80),
    lat,
    lng,
    serviceRadiusKm: z.coerce.number().int().min(1).max(100),
    licenseNumber: optionalText(60),
    clinicName: optionalText(120),
  })
  .refine((d) => d.role !== "vet" || !!d.licenseNumber, {
    path: ["licenseNumber"],
    message: "Vets must provide a license number",
  });

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(30),
  city: z.string().trim().min(2).max(80),
  bio: optionalText(500),
  lat,
  lng,
  serviceRadiusKm: z.coerce.number().int().min(1).max(100),
});

export const createCaseSchema = z.object({
  title: z.string().trim().min(5, "Give the report a short title").max(120),
  description: z.string().trim().min(10, "Describe the animal and its condition").max(2000),
  species: z.enum(SPECIES),
  severity: z.enum(SEVERITIES),
  injuryTags,
  lat,
  lng,
  addressText: optionalText(200),
  city: optionalText(80),
  maxVolunteers: z.coerce.number().int().min(1).max(10),
  maxVets: z.coerce.number().int().min(1).max(3),
  fundingGoal: z.coerce.number().min(0).max(100_000),
  imageUrls: jsonStringArray.pipe(z.array(z.url()).min(1, "Add at least one photo").max(6)),
  imageKeys: jsonStringArray,
  photoReading: z.string().optional(),
});

export const caseUpdateSchema = z.object({
  caseId: z.uuid(),
  message: z.string().trim().min(2).max(1000),
});

export const resolveCaseSchema = z.object({
  caseId: z.uuid(),
  outcome: z.enum(OUTCOMES),
  outcomeNote: z.string().trim().min(10, "Tell the community what happened").max(1000),
});

const medicationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  dose: z.string().trim().min(1).max(60),
  route: z.string().trim().min(1).max(40),
  frequency: z.string().trim().min(1).max(60),
  durationDays: z.coerce.number().int().min(0).max(365).optional(),
});

export const treatmentSchema = z.object({
  caseId: z.uuid(),
  diagnosis: z.string().trim().min(3).max(300),
  injuryTags,
  medications: z
    .string()
    .optional()
    .transform((v, ctx) => {
      try {
        return v ? (JSON.parse(v) as unknown) : [];
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid medications" });
        return z.NEVER;
      }
    })
    .pipe(z.array(medicationSchema).max(20)),
  procedures: optionalText(2000),
  notes: optionalText(2000),
  outcome: z
    .enum([...OUTCOMES, "ongoing"])
    .transform((v) => (v === "ongoing" ? null : v)),
});

export const expenseSchema = z.object({
  caseId: z.uuid(),
  amount: z.coerce.number().positive("Enter an amount").max(100_000),
  description: z.string().trim().min(3).max(300),
  receiptUrl: z.url("Upload a receipt").optional().or(z.literal("").transform(() => undefined)),
});

const donationCurrency = (process.env.NEXT_PUBLIC_CURRENCY ?? "usd").toLowerCase();
/** Stripe rejects charges that convert to under about US$0.50. 200 LKR stays above that. */
const minDonation = donationCurrency === "lkr" ? 200 : 1;
const maxDonation = donationCurrency === "lkr" ? 1_000_000 : 10_000;

export const donationSchema = z.object({
  caseId: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  amount: z.coerce
    .number()
    .min(minDonation, `Minimum donation is ${minDonation} ${donationCurrency.toUpperCase()}`)
    .max(maxDonation),
  donorName: optionalText(80),
  message: optionalText(300),
  isAnonymous: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export const flagSchema = z.object({
  caseId: z.uuid(),
  reason: z.string().trim().min(5, "Tell us what's wrong").max(500),
});
