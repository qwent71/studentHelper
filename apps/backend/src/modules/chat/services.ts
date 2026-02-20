import { chatRepo } from "./repo";

export const chatService = {
  async createSession(userId: string, mode: "fast" | "learning", title?: string) {
    return chatRepo.createSession({
      userId,
      title: title ?? "Новый чат",
      mode,
    });
  },

  async getSession(sessionId: string, userId: string) {
    const session = await chatRepo.getSessionById(sessionId);
    if (!session || session.userId !== userId) return null;
    return session;
  },

  async listSessions(userId: string) {
    return chatRepo.getSessionsByUserId(userId);
  },

  async updateSession(
    sessionId: string,
    userId: string,
    data: { title?: string; status?: "active" | "completed" | "archived" },
  ) {
    const session = await chatRepo.getSessionById(sessionId);
    if (!session || session.userId !== userId) return null;

    const updateData: Parameters<typeof chatRepo.updateSession>[1] = {};
    if (data.title) updateData.title = data.title;
    if (data.status) {
      updateData.status = data.status;
      if (data.status === "completed") updateData.endedAt = new Date();
      if (data.status === "archived") updateData.archivedAt = new Date();
    }

    return chatRepo.updateSession(sessionId, updateData);
  },

  async sendMessage(
    sessionId: string,
    userId: string,
    content: string,
    sourceType: "text" | "image" | "rag" = "text",
  ) {
    const session = await chatRepo.getSessionById(sessionId);
    if (!session || session.userId !== userId) return null;
    if (session.status !== "active") return null;

    const userMessage = await chatRepo.createMessage({
      chatId: sessionId,
      role: "user",
      content,
      sourceType,
    });

    // Stub assistant response — real AI generation comes in TASK-007
    const assistantMessage = await chatRepo.createMessage({
      chatId: sessionId,
      role: "assistant",
      content: `[Stub] Ответ на: "${content.slice(0, 100)}"`,
      sourceType: "text",
    });

    return { userMessage, assistantMessage };
  },

  async getMessages(sessionId: string, userId: string) {
    const session = await chatRepo.getSessionById(sessionId);
    if (!session || session.userId !== userId) return null;
    return chatRepo.getMessagesByChatId(sessionId);
  },
};
