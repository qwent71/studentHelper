import { Elysia } from "elysia";
import { env } from "@student-helper/config";

const app = new Elysia()
  .get("/", () => ({ status: "ok" }))
  .listen(env.BACKEND_PORT);

console.log(`Backend running at http://localhost:${app.server?.port}`);
