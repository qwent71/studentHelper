import { Elysia } from "elysia";
import { authGuardPlugin } from "../../plugins/auth";

export const adminRoutes = new Elysia({ prefix: "/admin" }).use(authGuardPlugin).get(
  "/",
  ({ user }) => ({ module: "admin", userId: user.id }),
  { adminAuth: true },
);
