import { Elysia } from "elysia";
import { SignJWT } from "jose";
import { env } from "@student-helper/config";
import { authGuardPlugin } from "../../plugins/auth";

export const centrifugoRoutes = new Elysia({ prefix: "/centrifugo" }).use(authGuardPlugin).get(
  "/token",
  async ({ user }) => {
    const secret = new TextEncoder().encode(env.CENTRIFUGO_TOKEN_SECRET);
    const token = await new SignJWT({ sub: String(user.id) })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("5m")
      .setIssuedAt()
      .sign(secret);
    return { token };
  },
  { auth: true },
);
