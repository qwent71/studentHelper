import { Elysia, t } from "elysia";
import { authGuardPlugin } from "../../plugins/auth";
import * as chatServices from "./services";

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .use(authGuardPlugin)
  .post(
    "/",
    async ({ user, body, status }) => {
      const chat = await chatServices.createChat(user.id, body.title);
      return status(201, chat);
    },
    {
      auth: true,
      body: t.Object({ title: t.String() }),
    },
  )
  .get(
    "/",
    async ({ user }) => {
      const chats = await chatServices.getUserChats(user.id);
      return chats;
    },
    { auth: true },
  )
  .get(
    "/:chatId",
    async ({ user, params, status }) => {
      const chat = await chatServices.getChatWithMessages(
        params.chatId,
        user.id,
      );
      if (!chat) return status(404, { error: "Chat not found" });
      return chat;
    },
    {
      auth: true,
      params: t.Object({ chatId: t.String() }),
    },
  )
  .post(
    "/:chatId/messages",
    async ({ user, params, body, status }) => {
      const message = await chatServices.sendMessage(
        params.chatId,
        user.id,
        body.content,
      );
      if (!message) return status(404, { error: "Chat not found" });
      return status(201, message);
    },
    {
      auth: true,
      params: t.Object({ chatId: t.String() }),
      body: t.Object({ content: t.String() }),
    },
  );
