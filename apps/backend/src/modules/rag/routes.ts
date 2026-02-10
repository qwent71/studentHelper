import { Elysia } from "elysia";

export const ragRoutes = new Elysia({ prefix: "/rag" }).get("/", () => ({
  module: "rag",
}));
