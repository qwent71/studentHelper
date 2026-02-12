import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

export const authClient = createAuthClient({
  baseURL: process.env.BACKEND_URL ?? "http://localhost:3001",
  basePath: "/api/auth",
  plugins: [
    magicLinkClient(),
    adminClient(),
    organizationClient(),
    nextCookies(),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
