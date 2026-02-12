import { treaty, type Treaty } from "@elysiajs/eden";
import type { App } from "@student-helper/backend/app-type";
import { getBackendUrl } from "./env";

export function getApiBaseUrl(): string {
  return getBackendUrl();
}

export const api: Treaty.Create<App> = treaty<App>(getApiBaseUrl(), {
  fetch: { credentials: "include" },
});
