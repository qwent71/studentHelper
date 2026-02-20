import { eq, desc, asc, and } from "drizzle-orm";
import { db } from "../../db";
import { chat, message } from "../../db/schema";

export type CreateSessionInput = {
  userId: string;
  title: string;
  mode: "fast" | "learning";
};

export type CreateMessageInput = {
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sourceType?: "text" | "image" | "rag";
};

export const chatRepo = {
  async createSession(input: CreateSessionInput) {
    const [row] = await db
      .insert(chat)
      .values({
        userId: input.userId,
        title: input.title,
        mode: input.mode,
        status: "active",
      })
      .returning();
    return row;
  },

  async getSessionById(id: string) {
    return db.query.chat.findFirst({
      where: eq(chat.id, id),
    });
  },

  async getSessionsByUserId(userId: string) {
    return db.query.chat.findMany({
      where: and(eq(chat.userId, userId)),
      orderBy: desc(chat.createdAt),
    });
  },

  async updateSession(
    id: string,
    data: Partial<{
      title: string;
      status: "active" | "completed" | "archived";
      endedAt: Date;
      archivedAt: Date;
    }>,
  ) {
    const [row] = await db
      .update(chat)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chat.id, id))
      .returning();
    return row;
  },

  async createMessage(input: CreateMessageInput) {
    const [row] = await db
      .insert(message)
      .values({
        chatId: input.chatId,
        role: input.role,
        content: input.content,
        sourceType: input.sourceType ?? "text",
      })
      .returning();
    return row;
  },

  async getMessagesByChatId(chatId: string) {
    return db.query.message.findMany({
      where: eq(message.chatId, chatId),
      orderBy: asc(message.createdAt),
    });
  },
};
