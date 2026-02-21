import { Elysia, t } from "elysia";
import { authGuardPlugin } from "../../plugins/auth";
import * as chatService from "./services";
import { ChatNotFoundError } from "./services";

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .use(authGuardPlugin)
  .post(
    "/",
    async ({ user, body }) => {
      const chat = await chatService.createChat(user.id, body.title);
      return chat;
    },
    {
      auth: true,
      body: t.Object({
        title: t.Optional(t.String({ maxLength: 200 })),
      }),
    },
  )
  .get(
    "/",
    async ({ user }) => {
      const chats = await chatService.listUserChats(user.id);
      return { chats };
    },
    { auth: true },
  )
  .get(
    "/:chatId/messages",
    async ({ user, params, status }) => {
      try {
        const messages = await chatService.getChatMessages(
          params.chatId,
          user.id,
        );
        return { messages };
      } catch (err) {
        if (err instanceof ChatNotFoundError) {
          return status(404, { error: "Chat not found" });
        }
        throw err;
      }
    },
    {
      auth: true,
      params: t.Object({ chatId: t.String() }),
    },
  )
  .post(
    "/:chatId/messages",
    async ({ user, params, body, status }) => {
      try {
        const message = await chatService.sendMessage(
          params.chatId,
          user.id,
          body.content,
        );
        return status(201, { message });
      } catch (err) {
        if (err instanceof ChatNotFoundError) {
          return status(404, { error: "Chat not found" });
        }
        throw err;
      }
    },
    {
      auth: true,
      params: t.Object({ chatId: t.String() }),
      body: t.Object({
        content: t.String({ minLength: 1, maxLength: 10000 }),
      }),
    },
  );
