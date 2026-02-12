"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { getBackendUrl } from "@/shared/lib/env";

export const authClient = createAuthClient({
  baseURL: getBackendUrl(),
  basePath: "/api/auth",
  plugins: [magicLinkClient(), adminClient(), organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
