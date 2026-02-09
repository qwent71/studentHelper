import { Elysia } from "elysia";

const port = process.env["BACKEND_PORT"] ?? 3001;

const app = new Elysia()
  .get("/", () => ({ status: "ok" }))
  .listen(port);

console.log(`Backend running at http://localhost:${app.server?.port}`);
