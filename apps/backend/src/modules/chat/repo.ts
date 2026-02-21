import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema";

export function createChat(userId: string, title: string) {
  return db
    .insert(schema.chat)
    .values({ userId, title })
    .returning()
    .then((rows) => rows[0]!);
}

export function getChatById(chatId: string) {
  return db.query.chat.findFirst({
    where: eq(schema.chat.id, chatId),
  });
}

export function getChatByIdForUser(chatId: string, userId: string) {
  return db.query.chat.findFirst({
    where: and(eq(schema.chat.id, chatId), eq(schema.chat.userId, userId)),
  });
}

export function listUserChats(userId: string) {
  return db.query.chat.findMany({
    where: and(
      eq(schema.chat.userId, userId),
      isNull(schema.chat.archivedAt),
    ),
    orderBy: desc(schema.chat.updatedAt),
  });
}

export function createMessage(
  chatId: string,
  role: "user" | "assistant" | "system",
  content: string,
) {
  return db
    .insert(schema.message)
    .values({ chatId, role, content })
    .returning()
    .then((rows) => rows[0]!);
}

export async function getMessagesByChatId(chatId: string, limit?: number) {
  if (limit) {
    const rows = await db.query.message.findMany({
      where: eq(schema.message.chatId, chatId),
      orderBy: desc(schema.message.createdAt),
      limit,
    });
    return rows.reverse();
  }

  return db.query.message.findMany({
    where: eq(schema.message.chatId, chatId),
    orderBy: asc(schema.message.createdAt),
  });
}

export function updateChatTimestamp(chatId: string) {
  return db
    .update(schema.chat)
    .set({ updatedAt: new Date() })
    .where(eq(schema.chat.id, chatId));
}
