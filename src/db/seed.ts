import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { sql } = await import("drizzle-orm");
  const bcrypt = (await import("bcryptjs")).default;
  const { db } = await import("./index");
  const s = await import("./schema");
  const { BADGES } = await import("../lib/constants");

  console.log("Clearing existing data...");
  await db.execute(sql`
    TRUNCATE TABLE case_flags, user_badges, badges, points_ledger, escalations, notifications,
      donations, expenses, treatment_reports, case_updates, case_responders, case_images,
      cases, vet_profiles, users RESTART IDENTITY CASCADE
  `);

  await db.insert(s.badges).values(BADGES);

  const passwordHash = await bcrypt.hash("password123", 10);
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

  const [admin, vetPriya, vetArjun, vetMeera, vetPending, volRahul, volAisha, volKaran, volSneha, volDev] =
    await db
      .insert(s.users)
      .values([
        { name: "Admin", email: "admin@kunchanada.dev", passwordHash, role: "admin", city: "Colombo", lat: 6.9271, lng: 79.8612, phone: "+94 11 200 0000" },
        { name: "Dr. Priya Nair", email: "priya@kunchanada.dev", passwordHash, role: "vet", city: "Colombo", lat: 6.8917, lng: 79.8567, phone: "+94 77 111 1111", serviceRadiusKm: 15, bio: "Small animal surgeon, 9 years. Happy to help strays on weekends." },
        { name: "Dr. Arjun Rao", email: "arjun@kunchanada.dev", passwordHash, role: "vet", city: "Kandy", lat: 7.2906, lng: 80.6337, phone: "+94 77 222 2222", serviceRadiusKm: 20 },
        { name: "Dr. Meera Iyer", email: "meera@kunchanada.dev", passwordHash, role: "vet", city: "Galle", lat: 6.0329, lng: 80.2168, phone: "+94 77 333 3333", serviceRadiusKm: 12 },
        { name: "Dr. Vikram Shah", email: "vikram@kunchanada.dev", passwordHash, role: "vet", city: "Colombo", lat: 6.8649, lng: 79.8997, phone: "+94 77 444 4444" },
        { name: "Rahul Menon", email: "rahul@kunchanada.dev", passwordHash, role: "volunteer", city: "Colombo", lat: 6.9344, lng: 79.8428, phone: "+94 77 555 5555", serviceRadiusKm: 8 },
        { name: "Aisha Khan", email: "aisha@kunchanada.dev", passwordHash, role: "volunteer", city: "Colombo", lat: 6.8747, lng: 79.86, phone: "+94 77 666 6666", serviceRadiusKm: 10 },
        { name: "Karan Patel", email: "karan@kunchanada.dev", passwordHash, role: "volunteer", city: "Kandy", lat: 7.2935, lng: 80.641, phone: "+94 77 777 7777" },
        { name: "Sneha Reddy", email: "sneha@kunchanada.dev", passwordHash, role: "volunteer", city: "Colombo", lat: 6.9094, lng: 79.8943, phone: "+94 77 888 8888", serviceRadiusKm: 12 },
        { name: "Dev Sharma", email: "dev@kunchanada.dev", passwordHash, role: "volunteer", city: "Galle", lat: 6.0367, lng: 80.217, phone: "+94 77 999 9999" },
      ])
      .returning();

  await db.insert(s.vetProfiles).values([
    { userId: vetPriya.id, licenseNumber: "SLVC-2016-0412", clinicName: "Bambalapitiya Pet Clinic", verifiedAt: minutesAgo(60 * 24 * 30), verifiedById: admin.id },
    { userId: vetArjun.id, licenseNumber: "SLVC-2012-1189", clinicName: "Kandy Animal Hospital", verifiedAt: minutesAgo(60 * 24 * 20), verifiedById: admin.id },
    { userId: vetMeera.id, licenseNumber: "SLVC-2018-0077", clinicName: "Galle Fort Vet Care", verifiedAt: minutesAgo(60 * 24 * 10), verifiedById: admin.id },
    { userId: vetPending.id, licenseNumber: "SLVC-2021-0931", clinicName: "Nugegoda Vets" },
  ]);

  const img = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=70&auto=format&fit=crop`;

  const caseRows = await db
    .insert(s.cases)
    .values([
      {
        reporterId: volRahul.id,
        title: "Dog hit by a car near Fort railway",
        description: "Brown street dog lying by the road, back leg looks broken, still conscious and breathing fast. Traffic is heavy here, I have moved him to the footpath.",
        species: "dog", severity: "critical", status: "reported",
        injuryTags: ["road-accident", "fracture"],
        lat: 6.9344, lng: 79.8428, addressText: "Olcott Mawatha, near Fort railway station", city: "Colombo",
        fundingGoalCents: 15000, createdAt: minutesAgo(42),
      },
      {
        reporterId: volAisha.id,
        title: "Kitten with an eye infection behind the bakery",
        description: "Small grey kitten, both eyes crusted shut and swollen. Mother not around. Hiding under a parked scooter.",
        species: "cat", severity: "urgent", status: "assigned",
        injuryTags: ["eye-injury", "orphaned"],
        lat: 6.8747, lng: 79.86, addressText: "Wellawatte, Galle Road", city: "Colombo",
        fundingGoalCents: 5000, raisedCents: 2500, createdAt: minutesAgo(180),
      },
      {
        reporterId: volSneha.id,
        title: "Cow with a deep wound on her leg",
        description: "Cow near the lake with a large open wound on the left hind leg, flies on it. Walking with a limp.",
        species: "cow", severity: "urgent", status: "in_treatment",
        injuryTags: ["open-wound", "maggot-wound"],
        lat: 6.9094, lng: 79.8943, addressText: "Near Diyawanna lake, Rajagiriya", city: "Colombo",
        fundingGoalCents: 20000, raisedCents: 12000, spentCents: 4500,
        firstVetCheckInAt: minutesAgo(60 * 20), createdAt: minutesAgo(60 * 26),
      },
      {
        reporterId: volKaran.id,
        title: "Pigeon tangled in kite string",
        description: "Pigeon hanging from a tree branch with manja wrapped around its wing.",
        species: "bird", severity: "urgent", status: "reported",
        injuryTags: ["entangled"],
        lat: 6.0329, lng: 80.2168, addressText: "Galle Fort ramparts", city: "Galle",
        createdAt: minutesAgo(25),
      },
      {
        reporterId: volDev.id,
        title: "Malnourished puppy litter under a bridge",
        description: "Four puppies, very thin, mother looks weak too. Need food and deworming.",
        species: "dog", severity: "stable", status: "verified",
        injuryTags: ["malnutrition", "orphaned"],
        lat: 7.2935, lng: 80.641, addressText: "Under the Kandy station flyover", city: "Kandy",
        fundingGoalCents: 8000, raisedCents: 1000,
        verifiedAt: minutesAgo(60 * 5), createdAt: minutesAgo(60 * 6),
      },
      {
        reporterId: volRahul.id,
        title: "Street dog with severe mange",
        description: "Female dog with almost no fur on her back, scratching constantly. Friendly and approachable.",
        species: "dog", severity: "stable", status: "resolved", outcome: "recovered",
        outcomeNote: "Six weeks of treatment, fur has grown back and she is back in her area, being fed by locals.",
        injuryTags: ["mange", "skin-infection"],
        lat: 6.9147, lng: 79.8778, addressText: "Borella junction", city: "Colombo",
        fundingGoalCents: 6000, raisedCents: 7500, spentCents: 5200,
        firstVetCheckInAt: minutesAgo(60 * 24 * 44), resolvedAt: minutesAgo(60 * 24 * 2), createdAt: minutesAgo(60 * 24 * 45),
      },
      {
        reporterId: volAisha.id,
        title: "Dog with maggot wound on the neck",
        description: "Collar mark wound on the neck, infested with maggots, smell is strong.",
        species: "dog", severity: "urgent", status: "resolved", outcome: "recovered",
        outcomeNote: "Wound cleaned and healed in 3 weeks.",
        injuryTags: ["maggot-wound", "open-wound"],
        lat: 6.8917, lng: 79.8567, addressText: "Bambalapitiya, Galle Road", city: "Colombo",
        fundingGoalCents: 4000, raisedCents: 4000, spentCents: 3100,
        firstVetCheckInAt: minutesAgo(60 * 24 * 29), resolvedAt: minutesAgo(60 * 24 * 7), createdAt: minutesAgo(60 * 24 * 30),
      },
      {
        reporterId: volKaran.id,
        title: "Cat hit by a bike",
        description: "Cat was hit by a bike, bleeding from the mouth, cannot stand.",
        species: "cat", severity: "critical", status: "resolved", outcome: "deceased",
        outcomeNote: "Severe internal injuries. Dr. Meera tried for two hours but she did not make it. Thank you to everyone who came.",
        injuryTags: ["road-accident", "bleeding"],
        lat: 6.8301, lng: 79.8801, addressText: "Mount Lavinia station road", city: "Colombo",
        firstVetCheckInAt: minutesAgo(60 * 24 * 12), resolvedAt: minutesAgo(60 * 24 * 12 - 180), createdAt: minutesAgo(60 * 24 * 12 + 40),
      },
    ])
    .returning();

  const [hitDog, kitten, cow, pigeon, puppies, mangeDog, maggotDog, bikeCat] = caseRows;

  await db.insert(s.caseImages).values([
    { caseId: hitDog.id, url: img("photo-1543466835-00a7907e9de1"), uploadedById: volRahul.id },
    { caseId: kitten.id, url: img("photo-1514888286974-6c03e2ca1dba"), uploadedById: volAisha.id },
    { caseId: cow.id, url: img("photo-1546445317-29f4545e9d53"), uploadedById: volSneha.id },
    { caseId: pigeon.id, url: img("photo-1555169062-013468b47731"), uploadedById: volKaran.id },
    { caseId: puppies.id, url: img("photo-1548199973-03cce0bbc87b"), uploadedById: volDev.id },
    { caseId: mangeDog.id, url: img("photo-1583511655857-d19b40a7a54e"), uploadedById: volRahul.id },
    { caseId: maggotDog.id, url: img("photo-1517849845537-4d257902454a"), uploadedById: volAisha.id },
    { caseId: bikeCat.id, url: img("photo-1573865526739-10659fec78a7"), uploadedById: volKaran.id },
  ]);

  await db.insert(s.caseResponders).values([
    { caseId: kitten.id, userId: volSneha.id, role: "volunteer", status: "claimed", claimedAt: minutesAgo(150) },
    { caseId: kitten.id, userId: vetPriya.id, role: "vet", status: "claimed", claimedAt: minutesAgo(120) },
    { caseId: cow.id, userId: vetArjun.id, role: "vet", status: "checked_in", claimedAt: minutesAgo(60 * 25), checkedInAt: minutesAgo(60 * 20) },
    { caseId: cow.id, userId: volSneha.id, role: "volunteer", status: "checked_in", claimedAt: minutesAgo(60 * 25), checkedInAt: minutesAgo(60 * 21) },
    { caseId: mangeDog.id, userId: vetPriya.id, role: "vet", status: "checked_in", claimedAt: minutesAgo(60 * 24 * 44.5), checkedInAt: minutesAgo(60 * 24 * 44) },
    { caseId: mangeDog.id, userId: volAisha.id, role: "volunteer", status: "checked_in", claimedAt: minutesAgo(60 * 24 * 44.5), checkedInAt: minutesAgo(60 * 24 * 44) },
    { caseId: maggotDog.id, userId: vetPriya.id, role: "vet", status: "checked_in", claimedAt: minutesAgo(60 * 24 * 29.5), checkedInAt: minutesAgo(60 * 24 * 29) },
    { caseId: maggotDog.id, userId: volRahul.id, role: "volunteer", status: "checked_in", claimedAt: minutesAgo(60 * 24 * 29.5), checkedInAt: minutesAgo(60 * 24 * 29) },
    { caseId: bikeCat.id, userId: vetMeera.id, role: "vet", status: "checked_in", claimedAt: minutesAgo(60 * 24 * 12 + 30), checkedInAt: minutesAgo(60 * 24 * 12) },
    { caseId: bikeCat.id, userId: volDev.id, role: "volunteer", status: "checked_in", claimedAt: minutesAgo(60 * 24 * 12 + 35), checkedInAt: minutesAgo(60 * 24 * 12 + 10) },
  ]);

  await db.insert(s.caseUpdates).values(
    caseRows.flatMap((c) => [
      { caseId: c.id, userId: c.reporterId, type: "created" as const, message: "Case reported", createdAt: c.createdAt },
    ]),
  );
  await db.insert(s.caseUpdates).values([
    { caseId: kitten.id, userId: volSneha.id, type: "claim", message: "Sneha Reddy is on the way as a volunteer", createdAt: minutesAgo(150) },
    { caseId: kitten.id, userId: vetPriya.id, type: "claim", message: "Dr. Priya Nair claimed the vet slot", createdAt: minutesAgo(120) },
    { caseId: cow.id, userId: vetArjun.id, type: "check_in", message: "Dr. Arjun Rao checked in on site", createdAt: minutesAgo(60 * 20) },
    { caseId: cow.id, userId: vetArjun.id, type: "note", message: "Wound cleaned and dressed. Will need daily dressing for at least 10 days.", createdAt: minutesAgo(60 * 18) },
    { caseId: puppies.id, userId: volDev.id, type: "status_change", message: "Case verified on site", createdAt: minutesAgo(60 * 5) },
    { caseId: mangeDog.id, userId: volRahul.id, type: "outcome", message: "Resolved: Recovered", createdAt: minutesAgo(60 * 24 * 2) },
    { caseId: maggotDog.id, userId: vetPriya.id, type: "outcome", message: "Resolved: Recovered", createdAt: minutesAgo(60 * 24 * 7) },
    { caseId: bikeCat.id, userId: vetMeera.id, type: "outcome", message: "Resolved: Passed away", createdAt: minutesAgo(60 * 24 * 12 - 180) },
  ]);

  await db.insert(s.treatmentReports).values([
    {
      caseId: mangeDog.id, vetId: vetPriya.id, outcome: "recovered",
      diagnosis: "Sarcoptic mange with secondary bacterial skin infection",
      injuryTags: ["mange", "skin-infection"],
      medications: [
        { name: "Ivermectin", dose: "0.3 mg/kg", route: "Subcutaneous", frequency: "Every 14 days", durationDays: 42 },
        { name: "Cephalexin", dose: "22 mg/kg", route: "Oral", frequency: "Twice daily", durationDays: 14 },
      ],
      procedures: "Skin scraping to confirm mites. Medicated bath with chlorhexidine shampoo weekly.",
      notes: "Locals fed her the oral antibiotics in food. Recheck at 4 weeks showed good regrowth.",
      createdAt: minutesAgo(60 * 24 * 3),
    },
    {
      caseId: maggotDog.id, vetId: vetPriya.id, outcome: "recovered",
      diagnosis: "Myiasis (maggot infestation) in neck wound from tight collar",
      injuryTags: ["maggot-wound", "open-wound"],
      medications: [
        { name: "Turpentine oil", dose: "Topical, few drops", route: "Topical", frequency: "Once, to drive out maggots" },
        { name: "Ivermectin", dose: "0.2 mg/kg", route: "Subcutaneous", frequency: "Once" },
        { name: "Amoxicillin-clavulanate", dose: "12.5 mg/kg", route: "Oral", frequency: "Twice daily", durationDays: 7 },
        { name: "Meloxicam", dose: "0.1 mg/kg", route: "Oral", frequency: "Once daily", durationDays: 3 },
      ],
      procedures: "Removed collar, manual maggot removal, wound flushed with dilute povidone-iodine, fly-repellent spray around edges.",
      notes: "Daily dressing by volunteer Rahul for 10 days.",
      createdAt: minutesAgo(60 * 24 * 8),
    },
    {
      caseId: cow.id, vetId: vetArjun.id, outcome: null,
      diagnosis: "Infected laceration on left hind leg with early myiasis",
      injuryTags: ["open-wound", "maggot-wound"],
      medications: [
        { name: "Oxytetracycline LA", dose: "20 mg/kg", route: "Intramuscular", frequency: "Every 72 hours", durationDays: 9 },
        { name: "Meloxicam", dose: "0.5 mg/kg", route: "Subcutaneous", frequency: "Once daily", durationDays: 3 },
      ],
      procedures: "Debridement, maggot removal, wound packed with antiseptic dressing.",
      notes: "Ongoing. Needs daily dressing.",
      createdAt: minutesAgo(60 * 19),
    },
    {
      caseId: bikeCat.id, vetId: vetMeera.id, outcome: "deceased",
      diagnosis: "Blunt trauma with suspected internal haemorrhage",
      injuryTags: ["road-accident", "bleeding"],
      medications: [{ name: "Ringer's lactate", dose: "10 ml/kg bolus", route: "IV", frequency: "Once" }],
      procedures: "Oxygen support, IV fluids, attempted stabilization.",
      createdAt: minutesAgo(60 * 24 * 12 - 170),
    },
  ]);

  await db.insert(s.expenses).values([
    { caseId: cow.id, userId: vetArjun.id, amountCents: 4500, description: "Antibiotics, dressing supplies", status: "approved", reviewedById: admin.id, reviewedAt: minutesAgo(60 * 10) },
    { caseId: cow.id, userId: volSneha.id, amountCents: 1200, description: "Fly repellent spray and bandages", status: "pending" },
    { caseId: mangeDog.id, userId: vetPriya.id, amountCents: 5200, description: "Ivermectin course, antibiotics, shampoo", status: "approved", reviewedById: admin.id, reviewedAt: minutesAgo(60 * 24 * 3) },
    { caseId: maggotDog.id, userId: vetPriya.id, amountCents: 3100, description: "Medicines and dressing", status: "approved", reviewedById: admin.id, reviewedAt: minutesAgo(60 * 24 * 7) },
  ]);

  const currency = process.env.NEXT_PUBLIC_CURRENCY ?? "usd";
  await db.insert(s.donations).values([
    { caseId: kitten.id, donorId: volKaran.id, donorName: "Karan Patel", amountCents: 2500, currency, stripeSessionId: "seed_1", status: "completed", completedAt: minutesAgo(100) },
    { caseId: cow.id, donorName: "Anonymous", isAnonymous: true, amountCents: 10000, currency, stripeSessionId: "seed_2", status: "completed", completedAt: minutesAgo(60 * 22), message: "Get well soon!" },
    { caseId: cow.id, donorId: volRahul.id, donorName: "Rahul Menon", amountCents: 2000, currency, stripeSessionId: "seed_3", status: "completed", completedAt: minutesAgo(60 * 21) },
    { caseId: puppies.id, donorId: volAisha.id, donorName: "Aisha Khan", amountCents: 1000, currency, stripeSessionId: "seed_4", status: "completed", completedAt: minutesAgo(60 * 4) },
    { caseId: mangeDog.id, donorName: "Neha", amountCents: 7500, currency, stripeSessionId: "seed_5", status: "completed", completedAt: minutesAgo(60 * 24 * 40) },
    { caseId: maggotDog.id, donorId: volDev.id, donorName: "Dev Sharma", amountCents: 4000, currency, stripeSessionId: "seed_6", status: "completed", completedAt: minutesAgo(60 * 24 * 28) },
    { caseId: null, donorName: "Kunchanada supporter", amountCents: 50000, currency, stripeSessionId: "seed_7", status: "completed", completedAt: minutesAgo(60 * 24 * 5), message: "For the general fund" },
  ]);

  const ledger: (typeof s.pointsLedger.$inferInsert)[] = [];
  for (const c of caseRows) ledger.push({ userId: c.reporterId, reason: "report", points: 10, refId: c.id, createdAt: c.createdAt });
  const responders = await db.select().from(s.caseResponders);
  for (const r of responders) {
    ledger.push({ userId: r.userId, reason: "claim", points: 5, refId: r.caseId, createdAt: r.claimedAt });
    if (r.checkedInAt) ledger.push({ userId: r.userId, reason: "check_in", points: 15, refId: r.caseId, createdAt: r.checkedInAt });
  }
  const treatments = await db.select().from(s.treatmentReports);
  for (const t of treatments) ledger.push({ userId: t.vetId, reason: "treatment", points: 30, refId: t.id, createdAt: t.createdAt });
  for (const c of [mangeDog, maggotDog, bikeCat]) {
    for (const r of responders.filter((x) => x.caseId === c.id)) {
      ledger.push({ userId: r.userId, reason: "resolve", points: 20, refId: c.id, createdAt: c.resolvedAt ?? undefined });
    }
  }
  const allDonations = await db.select().from(s.donations);
  for (const d of allDonations) {
    if (d.donorId) ledger.push({ userId: d.donorId, reason: "donation", points: Math.min(50, Math.floor(d.amountCents / 100)), refId: d.id, createdAt: d.completedAt ?? undefined });
  }
  await db.insert(s.pointsLedger).values(ledger);
  await db.execute(sql`
    UPDATE users u SET points = COALESCE((SELECT SUM(points) FROM points_ledger p WHERE p.user_id = u.id), 0)
  `);

  await db.insert(s.userBadges).values([
    { userId: volRahul.id, badgeId: "first-report" },
    { userId: volRahul.id, badgeId: "first-responder" },
    { userId: volRahul.id, badgeId: "generous-heart" },
    { userId: volAisha.id, badgeId: "first-report" },
    { userId: volAisha.id, badgeId: "first-responder" },
    { userId: volAisha.id, badgeId: "generous-heart" },
    { userId: volKaran.id, badgeId: "first-report" },
    { userId: volKaran.id, badgeId: "generous-heart" },
    { userId: volSneha.id, badgeId: "first-report" },
    { userId: volSneha.id, badgeId: "first-responder" },
    { userId: volDev.id, badgeId: "first-report" },
    { userId: volDev.id, badgeId: "first-responder" },
    { userId: volDev.id, badgeId: "generous-heart" },
    { userId: vetPriya.id, badgeId: "first-responder" },
    { userId: vetArjun.id, badgeId: "first-responder" },
    { userId: vetMeera.id, badgeId: "first-responder" },
  ]);

  await db.insert(s.notifications).values([
    { userId: vetPriya.id, type: "new_case_nearby", caseId: hitDog.id, title: "Critical case near you", body: "Dog hit by a car near Fort railway" },
    { userId: volAisha.id, type: "new_case_nearby", caseId: hitDog.id, title: "Critical case near you", body: "Dog hit by a car near Fort railway" },
    { userId: volRahul.id, type: "case_resolved", caseId: mangeDog.id, title: "Case resolved", body: "Street dog with severe mange: Recovered" },
  ]);

  await db.insert(s.caseFlags).values([
    { caseId: pigeon.id, userId: volDev.id, reason: "Possible duplicate of another report on Carter Road" },
  ]);

  console.log("Seed complete. All demo accounts use password: password123");
  console.log("  admin@kunchanada.dev (admin), priya@kunchanada.dev (vet), rahul@kunchanada.dev (volunteer)");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
