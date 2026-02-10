import { Elysia } from "elysia";

export const familyRoutes = new Elysia({ prefix: "/family" }).get("/", () => ({
  module: "family",
}));
