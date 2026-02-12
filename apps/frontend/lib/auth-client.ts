"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
  basePath: "/api/auth",
  plugins: [magicLinkClient(), adminClient(), organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
