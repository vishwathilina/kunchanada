// Dev-only helper: prints a session JWT for a user email so API routes can be exercised with curl.
// Usage: npx tsx scripts/dev-token.mts priya@kunchanada.dev
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/dev-token.mts <email>");
  process.exit(1);
}

const { eq } = await import("drizzle-orm");
const { db } = await import("../src/db/index");
const { users } = await import("../src/db/schema");
const { signSession } = await import("../src/lib/jwt");

const [user] = await db.select().from(users).where(eq(users.email, email));
if (!user) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}
console.log(await signSession({ sub: user.id, role: user.role, name: user.name }));
process.exit(0);
