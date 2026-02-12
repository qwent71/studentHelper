import { treaty, type Treaty } from "@elysiajs/eden";
import type { App } from "@student-helper/backend/app-type";

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      "http://localhost:3001"
    );
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";
}

export const api: Treaty.Create<App> = treaty<App>(getApiBaseUrl(), {
  fetch: { credentials: "include" },
});
