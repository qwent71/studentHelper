import { Elysia } from "elysia";

export const chatRoutes = new Elysia({ prefix: "/chat" }).get("/", () => ({
  module: "chat",
}));
