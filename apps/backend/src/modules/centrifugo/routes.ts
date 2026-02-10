import { Elysia } from "elysia";
import { SignJWT } from "jose";
import { env } from "@student-helper/config";
import { auth } from "../../auth";

export const centrifugoRoutes = new Elysia({ prefix: "/centrifugo" }).get(
  "/token",
  async ({ status, headers }) => {
    const requestHeaders = new Headers();
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) requestHeaders.set(key, value);
    }

    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user?.id) return status(401, { error: "Unauthorized" });

    const secret = new TextEncoder().encode(env.CENTRIFUGO_TOKEN_SECRET);
    const token = await new SignJWT({ sub: String(session.user.id) })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("5m")
      .setIssuedAt()
      .sign(secret);

    return { token };
  },
);
