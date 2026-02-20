import { Elysia, t } from "elysia";
import { authGuardPlugin } from "../../plugins/auth";
import { chatService } from "./services";

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .use(authGuardPlugin)
  // ── Create session ──
  .post(
    "/sessions",
    async ({ body, user }) => {
      const session = await chatService.createSession(
        user.id,
        body.mode,
        body.title,
      );
      return session;
    },
    {
      auth: true,
      body: t.Object({
        mode: t.Union([t.Literal("fast"), t.Literal("learning")]),
        title: t.Optional(t.String()),
      }),
    },
  )
  // ── List sessions ──
  .get(
    "/sessions",
    async ({ user }) => {
      const sessions = await chatService.listSessions(user.id);
      return sessions;
    },
    { auth: true },
  )
  // ── Get session ──
  .get(
    "/sessions/:id",
    async ({ params, user, status }) => {
      const session = await chatService.getSession(params.id, user.id);
      if (!session) return status(404, { error: "Session not found" });
      return session;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
    },
  )
  // ── Update session ──
  .patch(
    "/sessions/:id",
    async ({ params, body, user, status }) => {
      const session = await chatService.updateSession(
        params.id,
        user.id,
        body,
      );
      if (!session) return status(404, { error: "Session not found" });
      return session;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal("active"),
            t.Literal("completed"),
            t.Literal("archived"),
          ]),
        ),
      }),
    },
  )
  // ── Send message (text only, JSON body) ──
  .post(
    "/sessions/:id/messages",
    async ({ params, body, user, status }) => {
      const result = await chatService.sendMessage(
        params.id,
        user.id,
        body.content,
        body.sourceType,
        undefined,
        body.templateId,
      );
      if (!result)
        return status(404, { error: "Session not found or not active" });
      return result;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        content: t.String(),
        sourceType: t.Optional(
          t.Union([
            t.Literal("text"),
            t.Literal("image"),
            t.Literal("rag"),
          ]),
        ),
        templateId: t.Optional(t.String()),
      }),
    },
  )
  // ── Send message with image (multipart form) ──
  .post(
    "/sessions/:id/messages/image",
    async ({ params, body, user, status }) => {
      const imageFile = body.image;
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

      const result = await chatService.sendMessage(
        params.id,
        user.id,
        body.content ?? "",
        "image",
        imageBuffer,
        body.templateId,
      );
      if (!result)
        return status(404, { error: "Session not found or not active" });
      return result;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        image: t.File({
          type: ["image/png", "image/jpeg", "image/webp", "image/bmp"],
          maxSize: "10m",
        }),
        content: t.Optional(t.String()),
        templateId: t.Optional(t.String()),
      }),
    },
  )
  // ── Get messages ──
  .get(
    "/sessions/:id/messages",
    async ({ params, user, status }) => {
      const messages = await chatService.getMessages(params.id, user.id);
      if (!messages) return status(404, { error: "Session not found" });
      return messages;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
    },
  );
