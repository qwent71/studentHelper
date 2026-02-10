import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "@student-helper/config";
import { authPlugin } from "./plugins/auth";
import { accountRoutes } from "./modules/account/routes";
import { chatRoutes } from "./modules/chat/routes";
import { uploadsRoutes } from "./modules/uploads/routes";
import { textbookRoutes } from "./modules/textbook/routes";
import { familyRoutes } from "./modules/family/routes";
import { ragRoutes } from "./modules/rag/routes";
import { adminRoutes } from "./modules/admin/routes";
import { centrifugoRoutes } from "./modules/centrifugo/routes";

export function createApp() {
  return new Elysia()
    .use(cors({ origin: env.FRONTEND_URL, credentials: true }))
    .get("/health", () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }))
    .use(authPlugin)
    .use(accountRoutes)
    .use(chatRoutes)
    .use(uploadsRoutes)
    .use(textbookRoutes)
    .use(familyRoutes)
    .use(ragRoutes)
    .use(adminRoutes)
    .use(centrifugoRoutes);
}
