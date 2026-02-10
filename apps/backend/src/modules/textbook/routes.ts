import { Elysia } from "elysia";

export const textbookRoutes = new Elysia({ prefix: "/textbook" }).get("/", () => ({
  module: "textbook",
}));
