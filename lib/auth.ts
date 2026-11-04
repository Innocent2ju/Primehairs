import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { USER_ROLES } from "./roles";

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: USER_ROLES.customer,
        input: false,
      },
    },
  },
  session: {
    expiresIn: ONE_DAY_IN_SECONDS * 7,
    updateAge: ONE_DAY_IN_SECONDS,
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
