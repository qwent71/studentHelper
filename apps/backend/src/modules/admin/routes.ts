import { Elysia } from "elysia";

export const adminRoutes = new Elysia({ prefix: "/admin" }).get("/", () => ({
  module: "admin",
}));
