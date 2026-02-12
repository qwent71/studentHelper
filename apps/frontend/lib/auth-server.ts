import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";
import { getBackendUrl } from "./env";

export const authClient = createAuthClient({
  baseURL: getBackendUrl(),
  basePath: "/api/auth",
  plugins: [
    magicLinkClient(),
    adminClient(),
    organizationClient(),
    nextCookies(),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
