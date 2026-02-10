import { Elysia } from "elysia";

export const accountRoutes = new Elysia({ prefix: "/account" }).get("/", () => ({
  module: "account",
}));
