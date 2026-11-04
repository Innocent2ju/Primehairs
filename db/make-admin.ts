// Grants the admin role to an existing user. Usage: npx tsx db/make-admin.ts <email>
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { user } from "./schema";
import { USER_ROLES } from "../lib/roles";

async function makeAdmin(email: string) {
  const [updated] = await db
    .update(user)
    .set({ role: USER_ROLES.admin })
    .where(eq(user.email, email.toLowerCase()))
    .returning({ email: user.email });

  if (!updated) {
    console.error(`No user found with email ${email}. They must sign up first.`);
    process.exit(1);
  }

  console.log(`${updated.email} is now an admin.`);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx db/make-admin.ts <email>");
  process.exit(1);
}

makeAdmin(email);
