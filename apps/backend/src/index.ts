import { env } from "@student-helper/config";
import { createApp } from "./app";

const app = createApp().listen(env.BACKEND_PORT);

console.log(`Backend running at http://localhost:${app.server?.port}`);
