# Kunchanada — Product Proposal

> A community platform that turns "I just found an injured animal" into a coordinated rescue: nearby vets and volunteers are dispatched, funds are raised transparently, and every treatment becomes knowledge for the next rescue.

---

## 1. The problem

Every day, people find injured, sick, or stranded animals — on the street, on highways, in parks. What happens next is usually chaotic:

1. **Nobody knows who to call.** Helplines are city-specific, often overloaded, and frequently unreachable at night.
2. **Help is uncoordinated.** A post in a WhatsApp or Facebook group gets 40 "praying" replies, two people show up at once, and three other animals across town get nobody.
3. **Vets who want to help can't be reached.** Many vets are willing to volunteer occasionally but there is no channel that alerts them only when an animal is *near them* and *needs a vet*.
4. **Money is opaque.** Crowdfunding for animal treatment relies on trust. Donors rarely see what was spent and on what.
5. **Knowledge is lost.** A volunteer who successfully treated maggot wounds on a street dog last month has no way to pass on that exact protocol to the next volunteer facing the same injury.
6. **Outcomes are invisible.** Reporters and donors almost never learn whether the animal survived.
7. **Volunteer burnout.** Helpers do hard, unpaid, emotionally heavy work with no recognition.

## 2. The solution

Kunchanada is a geo-aware rescue coordination platform with five pillars:

| Pillar | What it does |
| --- | --- |
| **Report** | Anyone can report an animal in seconds: photo, GPS location, species, severity. |
| **Dispatch** | Verified vets and volunteers within their chosen radius are notified instantly. Responder slots are capped so help spreads across cases. |
| **Escalate** | If no vet checks in within a time window, the reporter can press **Emergency** to get direct contact details of verified on-call vets nearby, and admins are alerted. |
| **Fund** | Donors fund a specific case or the general fund via Stripe. Every case shows raised vs. spent with receipts. |
| **Learn & Recognize** | Structured treatment reports build a knowledge base that suggests treatments for similar future cases. Volunteers earn points, badges, and leaderboard ranks. |

## 3. User roles

| Role | Can do |
| --- | --- |
| **Visitor** (not logged in) | Browse cases & map, see outcomes, donate, view leaderboard. |
| **Volunteer** | Everything above + report cases, claim volunteer slots, check in, post updates, upload expenses, trigger emergency, earn badges. |
| **Vet** | Everything a volunteer can + claim vet slots, file treatment reports, appear in emergency contacts. Requires license verification by an admin. |
| **Admin** | Verify vets, moderate flagged reports, approve expenses, see platform stats. |

At registration every user provides: name, contact, role, home location (picked on a map), city, and a service radius (how far they are willing to travel). Vets additionally provide license number, clinic name, and a license document.

## 4. Case lifecycle

```
reported ──► verified ──► assigned ──► in_treatment ──► resolved
   │                                                      │
   └───────────── (flagged → removed by admin)            └─ outcome: recovered | released | adopted |
                                                                      transferred | deceased | not_found
```

- **reported** — created by a user; nearby responders are notified immediately (we do not wait for verification, speed matters more).
- **verified** — a second person (responder, admin) confirms the animal is real and still there.
- **assigned** — at least one responder claimed a slot.
- **in_treatment** — a vet has checked in on site.
- **resolved** — closing the case **requires** an outcome and a short final note, so the community always learns what happened.

### Severity and priority

Reporters select a severity: **critical** (life-threatening: heavy bleeding, hit by vehicle, unable to move), **urgent** (needs care within hours: wounds, infections, trapped), **stable** (needs help but not time critical: malnourished, skin disease).

Cases are sorted by a priority score:

```
priority = severityWeight            (critical 100, urgent 60, stable 25)
         + minutesWaiting / 5        (capped at 60)
         + openSlotsBonus            (more open slots → more need)
         − 40 if a vet is already checked in
```

This keeps the oldest critical cases with no help at the top of everyone's feed.

### Responder slot limits

Each case has `maxVolunteers` (default 3) and `maxVets` (default 1, editable by reporter/admin). Once slots fill, the case stops appearing in "needs help" feeds and nearby users are no longer pinged — so volunteers naturally flow to cases that still need hands.

### Emergency escalation

The **Emergency** button becomes active when a case has been open for `ESCALATION_MINUTES` (default 30) without any vet checking in. Pressing it:

1. Reveals phone numbers of verified, available vets within range (normally hidden for privacy).
2. Notifies all admins.
3. Logs an escalation record (used for platform analytics and response-time SLAs).

## 5. Treatment knowledge base

Vets file **structured** treatment reports rather than free text:

- Diagnosis
- Injury tags (e.g. `fracture`, `maggot-wound`, `mange`, `road-accident`, `dehydration`)
- Medications (name, dose, route, frequency, duration)
- Procedures performed
- Outcome

When a new case is opened, Kunchanada shows **similar past treatments**: same species, overlapping injury tags, ranked by how many of those treatments ended in a positive outcome (`recovered`, `released`, `adopted`). This is guidance for qualified responders, not a prescription — the UI always shows a medical disclaimer.

Over time this becomes a unique, crowd-sourced dataset of real-world street-animal treatment outcomes.

## 6. Donations & transparency

- Payments via **Stripe Checkout** (cards, wallets, local methods where Stripe supports them).
- Two destinations: a **specific case** (with a funding goal), or the **general fund** (used for cases that get no direct donations and platform operations).
- Responders upload **expense receipts** (vet bills, medicines, transport). Admins approve them.
- Every case page shows **raised / goal / spent** and the list of approved expenses with receipts.
- Donor names are optional (anonymous donations allowed).

**Phase 1:** funds are collected by the platform entity and disbursed to responders after expense approval.
**Phase 2:** Stripe Connect so verified vet clinics can receive funds directly.

## 7. Gamification

Points are recorded in an append-only ledger:

| Action | Points |
| --- | --- |
| Report a case | 10 |
| Claim a slot | 5 |
| Check in on site | 15 |
| File a treatment report | 30 |
| Resolve a case with outcome | 20 |
| Donate | 1 per $1 (max 50 per donation) |

Badges (examples): **First Responder**, **Guardian Angel** (10 cases helped), **Night Owl** (check-in between 22:00–05:00), **Healer** (5 treatment reports), **Lifesaver** (10 positive outcomes), **Generous Heart** (first donation), **Community Pillar** (500 points).

Leaderboards: **all-time**, **this month**, and **per city** — so small towns get their own heroes, not just big cities.

## 8. Trust & safety

| Risk | Mitigation |
| --- | --- |
| Fake / prank reports | Mandatory photo, flagging by users, admin moderation queue, rate limit on report creation, reporter reputation via points. |
| Unqualified "vets" | License number + document upload, manual admin verification before vet privileges activate. |
| Medical liability | Recommendations are framed as historical data, explicit disclaimer, only verified vets can file treatment reports. |
| Fund misuse | Expenses require receipts and admin approval; public raised-vs-spent ledger per case; Stripe handles all card data. |
| Privacy of helpers | Phone numbers hidden by default; revealed only via emergency escalation, and only for vets who opted into availability. |
| Volunteer safety | Guidance shown for dangerous situations (aggressive animal, highway) recommending waiting for professionals. |

## 9. Sustainability model

- Optional platform tip on donations (donor chooses, default 0%).
- NGO / shelter organization accounts (Phase 2) with team dashboards — paid tier.
- Municipal partnerships: anonymized data on injury hotspots (e.g. road segments with frequent animal accidents) for city planning.
- Corporate CSR sponsorship of the general fund and badges ("Sponsored by …").

## 10. Competitive landscape

| | Kunchanada | Helpline-based rescue orgs (e.g. Animal Aid Unlimited, SPCA / Blue Cross helplines) | Lost-pet networks (PawBoost, Petco Love Lost) | Adoption portals (Petfinder) | General crowdfunding (GoFundMe, Milaap, Ketto) | Social media groups (Facebook, WhatsApp, Nextdoor) |
| --- | --- | --- | --- | --- | --- | --- |
| Primary focus | Injured / in-need animals, end-to-end | Rescue by the org's own team | Reuniting lost pets | Adoption | Fundraising for anything | General community chatter |
| Anyone can report with photo + GPS | Yes | Partial (phone / WhatsApp) | Yes (lost/found pets) | No | No | Yes (unstructured) |
| Geo-matched alerts to nearby volunteer **vets** | Yes | No (own staff only) | No | No | No | No |
| Responder slot limits / load balancing | Yes | internal | No | No | No | No |
| Emergency escalation path | Yes | Yes (if helpline answers) | No | No | No | No |
| Per-case fundraising | Yes | Partial (org-level) | No | No | Yes | No |
| Spend transparency with receipts | Yes | Partial (annual reports) | — | — | Partial (optional updates) | No |
| Structured treatment knowledge base | Yes | internal only | No | No | No | No |
| Mandatory public outcome | Yes | Partial (selective stories) | Yes (reunited) | Yes (adopted) | No | No |
| Gamified volunteer recognition | Yes | No | Partial | No | No | No |
| Scales beyond one city without new staff | Yes | No | Yes | Yes | Yes | Yes |

### Where competitors are strong

- **Rescue organizations** have trained staff, ambulances, and hospitals — real capacity we don't replace. Kunchanada should **partner** with them (org accounts, routing cases to them) rather than compete.
- **Crowdfunding platforms** have brand trust and huge donor networks. We win on *specificity* (an animal near you, with receipts and an outcome) not reach.
- **Social groups** have zero friction and existing audiences. We must keep reporting as fast as posting a photo (target: < 30 seconds).

### Our differentiation in one line

> Kunchanada is the only product that connects **the person who finds the animal**, **the nearest willing vet**, **the donor**, and **the outcome** in one accountable loop — and learns from every case.

## 11. Technical architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router, Server Components, Server Actions) | One codebase for UI + API, streaming UI, great DX. |
| Database | Neon serverless Postgres + PostGIS | Real geospatial queries (`ST_DWithin`) with serverless scaling and branching. |
| ORM | Drizzle | Type-safe SQL, lightweight, first-class Neon support. |
| Auth | JWT (jose) in httpOnly cookie, bcrypt password hashes | Simple, no third-party dependency, works in proxy + server. |
| Images | UploadThing | Direct-to-storage uploads, no file handling on our servers. |
| Maps | Leaflet + OpenStreetMap | Free, no API key, marker clustering. |
| Payments | Stripe Checkout + webhooks | PCI handled by Stripe; webhook makes donation recording reliable. |
| Notifications | In-app notification center (polling) | Works everywhere, no extra infra. Web push/SMS in Phase 2. |

```
Reporter ──photo+GPS──► Case created ──► PostGIS radius query ──► notifications to nearby vets/volunteers
                                │
                     responders claim slots ──► check-in ──► treatment report ──► outcome published
                                │                                   │
                  no vet in N min → Emergency                knowledge base + points/badges
Donor ──Stripe Checkout──► webhook ──► donation recorded ──► case raised total
```

## 12. Roadmap

**Phase 1 — MVP (this build)**
Registration with roles & location, case reporting with photos, map + list with priority, nearby notifications, slot claiming & check-in, emergency escalation, treatment reports & suggestions, Stripe donations with expense transparency, points/badges/leaderboards, admin moderation & vet verification.

**Phase 2 — Growth**
Web push + SMS alerts, PWA offline reporting, NGO/shelter organization accounts, Stripe Connect payouts to clinics, multi-language UI, adoption listings for recovered animals.

**Phase 3 — Intelligence**
Image-based species/injury pre-tagging, injury hotspot heatmaps for municipalities, response-time SLAs per city, recurring donor subscriptions.

## 13. Success metrics

- Median time from report → first responder claim
- Median time from report → vet check-in
- % of cases resolved with a published outcome
- % positive outcomes
- Donation volume and % of funds backed by approved receipts
- Monthly active responders per city
