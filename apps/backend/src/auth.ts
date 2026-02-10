import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { organization } from "better-auth/plugins/organization";
import { admin } from "better-auth/plugins/admin";
import { env } from "@student-helper/config";
import { db } from "./db";

const isDev = env.NODE_ENV === "development";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,
  trustedOrigins: [env.FRONTEND_URL],
  emailAndPassword: { enabled: true },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (isDev) {
          console.log(`[Magic Link] ${email}: ${url}`);
          return;
        }
        throw new Error("Magic link email not configured for production");
      },
    }),
    organization(),
    admin(),
  ],
  advanced: {
    cookiePrefix: "sh",
    defaultCookieAttributes: {
      secure: !isDev,
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
    },
  },
});
