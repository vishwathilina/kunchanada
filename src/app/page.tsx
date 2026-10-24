import { eq, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { MomentRow, RoomPhoto, type Moment } from "@/components/home/room-and-row";
import { StripeLink } from "@/components/home/stripe-link";
import { db } from "@/db";
import { users, vetProfiles } from "@/db/schema";
import { formatMoney } from "@/lib/format";
import { PHOTOS, type StoryPhoto } from "@/lib/photos";
import { listCases, type CaseListItem } from "@/lib/queries/cases";

const MOMENTS: Moment[] = [
  {
    caption: "You see it",
    body: "A dog by the road, a bird that cannot stand, a calf in a ditch. Photograph it where it lies.",
    photo: PHOTOS.rescueDog,
    gap: 80,
  },
  {
    caption: "You pin the place",
    body: "The pin is the street you are standing on. Colombo, Kandy, Galle, or the junction in between.",
    photo: PHOTOS.elephantRescue,
    gap: 120,
  },
  {
    caption: "The radius hears",
    body: "Verified vets and volunteers are asked only when the animal sits inside the radius they chose.",
    photo: PHOTOS.wildcatKitten,
    gap: 96,
  },
  {
    caption: "Slots fill",
    body: "Each case holds a few responders, not a crowd. When the slots are taken, the call closes.",
    photo: PHOTOS.volunteerDog,
    gap: 140,
  },
  {
    caption: "The vet writes",
    body: "Treatment is a report: what was found, what was done, and what should happen the next time.",
    photo: PHOTOS.calfCheckup,
    gap: 88,
  },
  {
    caption: "The outcome is public",
    body: "Released, in care, or lost. The note and the money spent stay on the case for the next responder.",
    photo: PHOTOS.elephantCalf,
    gap: 112,
  },
];

const FIELD: { photo: StoryPhoto; values: [string, string, string, string]; place: string; maker: string }[] = [
  { photo: PHOTOS.rescueDog, values: ["Dog", "Street", "Blanket", "Held"], place: "Responder’s arms", maker: "A wrapped dog" },
  { photo: PHOTOS.elephantRescue, values: ["Elephant", "Ditch", "Crew", "Mud"], place: "The excavation", maker: "A calf in a ditch" },
  { photo: PHOTOS.wildcatKitten, values: ["Wildcat", "Hands", "Gloves", "Rest"], place: "A clinic hold", maker: "A kitten in gloves" },
  { photo: PHOTOS.falconClinic, values: ["Falcon", "Wing", "Wrap", "Pad"], place: "Clinic table", maker: "A wrapped wing" },
  { photo: PHOTOS.volunteerDog, values: ["Dog", "Field", "Kneel", "Face"], place: "Outdoors", maker: "A volunteer and a dog" },
  { photo: PHOTOS.poodleCast, values: ["Dog", "Paw", "Bandage", "Table"], place: "Treatment table", maker: "A bandaged paw" },
  { photo: PHOTOS.calfCheckup, values: ["Calf", "Farm", "Stethoscope", "Hold"], place: "A farm yard", maker: "A heart check" },
  { photo: PHOTOS.bearClinic, values: ["Bear", "Cub", "Exam", "Table"], place: "Wildlife clinic", maker: "A cub on the table" },
];

const STRIPS = [
  { bg: "#333231", fg: "#eeecea" },
  { bg: "#cdc3b6", fg: "#333231" },
  { bg: "#5c6b54", fg: "#ffffff" },
  { bg: "#e4e1dd", fg: "#333231" },
];


function cityCounts(cases: CaseListItem[]) {
  const counts = new Map<string, number>();
  for (const item of cases) {
    const city = item.city?.trim();
    if (!city) continue;
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4);
}

async function Docket() {
  await connection();
  const open = await listCases({ scope: "open" });
  const cities = cityCounts(open);
  if (cities.length === 0) {
    return <p className="mt-8 text-base">No open cases on the sheet.</p>;
  }
  return (
    <p className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-base">
      {cities.map(([city, count]) => (
        <Link key={city} href="/cases" className="text-[#333231] underline decoration-[#cdc3b6] decoration-2 underline-offset-4 hover:text-[#5c6b54]">
          {city} {count} open
        </Link>
      ))}
    </p>
  );
}

function Hero() {
  return (
    <section className="grid gap-3 bg-[#cdc3b6] p-3 lg:grid-cols-2">
      <article
        className="relative z-10 flex min-h-[70svh] min-w-0 flex-col overflow-hidden bg-[#eeecea] p-6 sm:p-10 lg:min-h-[calc(100svh-4.5rem)]"
        style={{ borderRadius: 16 }}
      >
        <div className="h-10 w-full overflow-hidden sm:h-14" aria-hidden>
          <div className="flex h-full w-max">
            {Array.from({ length: 48 }, (_, i) => (
              <span key={i} className={i % 2 === 0 ? "h-full w-7 shrink-0 bg-[#333231]" : "h-full w-7 shrink-0 bg-[#eeecea]"} />
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <p className="text-[length:var(--step-head)] leading-none">Kunchanada</p>
          <h1 className="mt-6 text-[length:var(--step-display)]">
            Found one.
            <br />
            A vet comes.
          </h1>
          <p className="mt-5 max-w-[36ch] text-base leading-relaxed">
            Kunchanada alerts verified vets and volunteers inside the radius they set, then publishes the treatment and the money spent.
          </p>
          <StripeLink href="/cases/new" className="mt-7 h-14 bg-[#5c6b54] px-8 text-base text-white">
            File a report
          </StripeLink>
          <Suspense fallback={<p className="mt-8 text-base">Reading the open sheet…</p>}>
            <Docket />
          </Suspense>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 pb-2 text-base">
          <Link href="/cases" className="hover:text-[#5c6b54]">
            Open cases
          </Link>
          <Link href="/donate" className="hover:text-[#5c6b54]">
            The fund
          </Link>
          <Link href="/register" className="hover:text-[#5c6b54]">
            Join as a vet
          </Link>
        </nav>
      </article>
      <div className="min-w-0">
        <RoomPhoto />
      </div>
    </section>
  );
}

async function Showcase() {
  await connection();
  const open = await listCases({ scope: "open", limit: 6 });
  const slips = open.slice(0, 6);
  return (
    <section className="relative h-[96svh] overflow-hidden bg-[#333231]">
      <img
        src={PHOTOS.cheetahField.src}
        alt={PHOTOS.cheetahField.alt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: PHOTOS.cheetahField.focus }}
      />
      <div className="absolute top-[10%] left-[8%] max-w-[34ch] bg-[#333231]/70 p-5 text-[#eeecea] sm:left-[18%] sm:p-7">
        <h2 className="arrive text-[length:var(--step-head)] text-[#eeecea]">Open right now</h2>
        <p className="arrive mt-3 text-base leading-relaxed">
          Each slip is a case on the sheet. Species, city, severity, and what has been raised.
        </p>
      </div>
      <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3">
        {slips.slice(0, 4).map((item, index) => (
          <Link
            key={item.id}
            href={`/cases/${item.id}`}
            className="arrive-fade flex min-w-0 flex-col overflow-hidden bg-[#eeecea] p-4 text-[#333231]"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <p className="text-base font-semibold leading-snug">{item.title}</p>
            <p className="my-2 text-base">· · ·</p>
            <p className="text-base">{item.species}</p>
            <p className="text-base">{item.city ?? "Sri Lanka"}</p>
            <p className="text-base capitalize">{item.severity}</p>
            <p className="text-base">{formatMoney(item.raisedCents)} raised</p>
            <p className="text-base">
              {item.vets}/{item.maxVets} vets · {item.volunteers}/{item.maxVolunteers} volunteers
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function Proof() {
  await connection();
  const vets = await db
    .select({ name: users.name, city: users.city })
    .from(users)
    .innerJoin(vetProfiles, eq(vetProfiles.userId, users.id))
    .where(isNotNull(vetProfiles.verifiedAt));

  const line = vets.map((vet) => vet.name.replace(/^Dr\.?\s+/i, "")).join("  ·  ");

  return (
    <section className="relative h-[78vh] overflow-hidden bg-[#333231]">
      <article className="arrive-fade absolute top-12 left-1/2 w-[calc(100%-40px)] -translate-x-1/2 overflow-hidden bg-[#eeecea] p-7 text-center sm:w-[56vw] sm:p-14" style={{ aspectRatio: "5 / 7" }}>
        <h2 className="text-[length:var(--step-head)]">On the sheet</h2>
        <img
          src={PHOTOS.calfCheckup.src}
          alt={PHOTOS.calfCheckup.alt}
          className="mt-6 aspect-video w-full object-cover"
          style={{ objectPosition: PHOTOS.calfCheckup.focus }}
        />
        <p className="mt-6 text-base leading-relaxed">
          {line || "Verified vets appear here once a licence is accepted."}
        </p>
      </article>
    </section>
  );
}

function Gallery() {
  return (
    <section className="bg-[#eeecea] px-5 py-16 sm:px-8 sm:py-24">
      <h2 className="arrive mb-10 text-[length:var(--step-head)]">In the field</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-4">
        {FIELD.map((tile, index) => {
          const ink = STRIPS[index % STRIPS.length]!;
          return (
            <figure key={tile.photo.src} className="arrive group" style={{ animationDelay: `${index * 70}ms` }}>
              <img
                src={tile.photo.src}
                alt={tile.photo.alt}
                width={800}
                height={1000}
                className="story-zoom aspect-[4/5] w-full object-cover"
                style={{ objectPosition: tile.photo.focus }}
              />
              <figcaption className="flex min-h-16 flex-col justify-center gap-1 overflow-hidden px-3 py-2 text-base" style={{ background: ink.bg, color: ink.fg }}>
                <span className="flex flex-wrap gap-x-2">
                  {tile.values.map((value) => (
                    <span key={value}>{value}</span>
                  ))}
                </span>
                <span className="truncate">{tile.place}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function Reply() {
  return (
    <section className="relative overflow-hidden bg-[#5c6b54] px-4 py-16 sm:h-[80svh] sm:px-[5vw] sm:py-0">
      <p className="arrive max-w-[34ch] text-base leading-relaxed text-[#eeecea] sm:absolute sm:bottom-16 sm:left-[5vw] sm:max-w-[28ch]">
        A report takes the photo, the pin, and the species. The nearest verified vet is the one who is asked.
      </p>
      <article
        className="arrive-fade relative mx-auto mt-10 w-[90%] rotate-1 bg-[#eeecea] p-8 text-center text-[#333231] sm:absolute sm:right-[6vw] sm:bottom-[-60px] sm:mt-0 sm:w-[44vw] sm:rotate-2 sm:p-12"
        style={{ aspectRatio: "7 / 5" }}
      >
        <h2 className="text-[length:var(--step-head)]">File it tonight</h2>
        <p className="mx-auto mt-4 max-w-[32ch] text-base leading-relaxed">Anyone can report. Vets and volunteers join with a location and a radius.</p>
        <StripeLink href="/cases/new" className="mt-6 flex h-14 w-full bg-[#333231] text-base text-[#eeecea]">
          File a report
        </StripeLink>
      </article>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="bg-[#eeecea] py-16 sm:py-24">
        <MomentRow moments={MOMENTS} />
      </section>
      <Suspense fallback={<section className="h-[96svh] bg-[#333231]" aria-hidden />}>
        <Showcase />
      </Suspense>
      <Suspense fallback={<section className="h-[40vh] bg-[#333231]" aria-hidden />}>
        <Proof />
      </Suspense>
      <Gallery />
      <Reply />
    </>
  );
}
