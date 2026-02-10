import { Elysia } from "elysia";
import { auth } from "../auth";

export const authPlugin = new Elysia({ name: "auth" })
  .mount("/api/auth", auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });
        if (!session) return status(401, { error: "Unauthorized" });
        return { user: session.user, session: session.session };
      },
    },
  });
