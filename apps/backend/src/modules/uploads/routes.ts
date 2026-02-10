import { Elysia } from "elysia";

export const uploadsRoutes = new Elysia({ prefix: "/uploads" }).get("/", () => ({
  module: "uploads",
}));
