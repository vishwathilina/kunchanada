# Kunchanada

Community animal rescue for Sri Lanka: report an injured animal, alert nearby volunteers and verified vets, fund treatment through Stripe, and publish the outcome. Treatment reports feed recommendations for similar future cases.

Product write-up and competitor comparison: [docs/PROPOSAL.md](docs/PROPOSAL.md).

## Team

**the odyssey**

1. vishwa thilina
2. kvindu madithya
3. somidu dilankara

## License

[Apache License 2.0](LICENSE).

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Drizzle ORM on Postgres with PostGIS
- JWT in an httpOnly cookie (`pr_session`)
- UploadThing for photos, receipts, and license documents
- Stripe Checkout for per-case donations and the general fund
- Leaflet + OpenStreetMap
- In-app notifications (TanStack Query, 20s poll)
- Photo reading through MiniMax M3.1 Flash on OpenRouter (`minimax/minimax-m3.1-flash`)

## Setup

### 1. Database

PostGIS is required. Either:

**Local container** (Docker or Podman):

```bash
docker compose up -d
# or: podman compose up -d
```

`docker-compose.yml` publishes Postgres on `localhost:5432`. If that port is taken:

```bash
podman run -d --name kunchanada-db \
  -e POSTGRES_USER=kunchanada -e POSTGRES_PASSWORD=kunchanada -e POSTGRES_DB=kunchanada \
  -p 5433:5432 docker.io/postgis/postgis:17-3.5
```

Then set `DATABASE_URL=postgres://kunchanada:kunchanada@localhost:5433/kunchanada`.

**Or Neon:** create a project, enable the PostGIS extension, and copy the connection string.

### 2. Environment

```bash
cp .env.example .env.local
```

Required for a full run:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres (Neon or local PostGIS) |
| `JWT_SECRET` | ≥32 characters. `openssl rand -base64 48` |
| `UPLOADTHING_TOKEN` | [UploadThing API keys](https://uploadthing.com/dashboard) |
| `STRIPE_SECRET_KEY` | [Stripe test keys](https://dashboard.stripe.com/test/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` (below) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_CURRENCY` | Defaults to `usd` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally |
| `ESCALATION_MINUTES` | Minutes before the emergency button unlocks (default 30) |
| `OPENROUTER_API_KEY` | Photo reading: species, visible injuries, and steps drawn from past cases of that species |

The app boots without Stripe or UploadThing. Donations and uploads show a configuration message until those keys are set. Case photos can also be added by pasting an image URL.

### 3. Install, migrate, seed

```bash
npm install
npm run db:migrate
npm run db:seed
```

Seeded demo accounts all use password `password123`:

| Email | Role |
| --- | --- |
| `admin@kunchanada.dev` | Admin |
| `priya@kunchanada.dev` | Verified vet (Colombo) |
| `vikram@kunchanada.dev` | Unverified vet |
| `rahul@kunchanada.dev` | Volunteer |
| `sneha@kunchanada.dev` | Volunteer |

### 4. Stripe webhooks (optional, needed to complete donations)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET`. The `/donate/success` page also reconciles the Checkout session, so local testing still works if the webhook is delayed.

### 5. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production |
| `npm run lint` / `npm run typecheck` | Checks |
| `npm run db:generate` | New Drizzle migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Reset and load demo data |
| `npm run db:studio` | Drizzle Studio |

## App map

| Path | |
| --- | --- |
| `/` | Landing: live stats, map, recent outcomes |
| `/cases` | Open cases + map, filters, priority sort |
| `/cases/new` | Report (signed in) |
| `/cases/[id]` | Timeline, responders, funds, emergency, treatments |
| `/donate` | General fund + underfunded cases |
| `/leaderboard` | All-time / monthly / city |
| `/dashboard` | Your cases, availability, profile, vet license |
| `/admin` | Vet verification, flags, expense approval |
| `/api/stripe/webhook` | Stripe events |
| `/api/uploadthing` | Uploads |
| `/api/notifications` | In-app inbox |
