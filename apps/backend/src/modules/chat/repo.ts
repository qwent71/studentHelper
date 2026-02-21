import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { chat, message } from "../../db/schema";

export function createChat(userId: string, title: string) {
  return db.insert(chat).values({ userId, title }).returning();
}

export function getChatById(chatId: string) {
  return db.query.chat.findFirst({
    where: eq(chat.id, chatId),
  });
}

export function getChatByIdForUser(chatId: string, userId: string) {
  return db.query.chat.findFirst({
    where: and(eq(chat.id, chatId), eq(chat.userId, userId)),
  });
}

export function listChatsByUser(userId: string, limit = 50, offset = 0) {
  return db.query.chat.findMany({
    where: eq(chat.userId, userId),
    orderBy: desc(chat.updatedAt),
    limit,
    offset,
  });
}

export function getChatMessages(chatId: string) {
  return db.query.message.findMany({
    where: eq(message.chatId, chatId),
    orderBy: message.createdAt,
  });
}

export function createMessage(
  chatId: string,
  role: "user" | "assistant" | "system",
  content: string,
) {
  return db.insert(message).values({ chatId, role, content }).returning();
}

export function updateChatTitle(chatId: string, title: string) {
  return db
    .update(chat)
    .set({ title, updatedAt: new Date() })
    .where(eq(chat.id, chatId))
    .returning();
}
