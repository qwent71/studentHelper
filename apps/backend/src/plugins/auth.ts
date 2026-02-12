import { Elysia } from "elysia";
import { auth } from "../auth";

export const authGuardPlugin = new Elysia({ name: "auth-guard" })
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401, { error: "Unauthorized" });
        return { user: session.user, session: session.session };
      },
    },
    adminAuth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401, { error: "Unauthorized" });
        if (session.user.role !== "admin")
          return status(403, { error: "Forbidden" });
        return { user: session.user, session: session.session };
      },
    },
  });

export const authPlugin = new Elysia({ name: "auth" })
  .all("/api/auth", ({ request }) => auth.handler(request))
  .all("/api/auth/*", ({ request }) => auth.handler(request))
  .use(authGuardPlugin);
