import { chatRepo } from "./repo";
import { getAIService } from "../ai";
import type { ChatMessage } from "../ai";
import { createOCRService, OCRError } from "../ocr";
import type { OCRResult } from "../ocr";

const SYSTEM_PROMPT =
  "Ты — StudentHelper, помощник для школьников. " +
  "Отвечай на русском языке. Решай задачи пошагово. " +
  "Если задача получена из изображения через OCR, учти, что текст может содержать неточности распознавания.";

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
    imageBuffer?: Buffer,
  ) {
    const session = await chatRepo.getSessionById(sessionId);
    if (!session || session.userId !== userId) return null;
    if (session.status !== "active") return null;

    let finalContent = content;
    let ocrResult: OCRResult | undefined;

    // If image is provided, run OCR to extract text
    if (imageBuffer) {
      try {
        const ocrService = createOCRService();
        ocrResult = await ocrService.extractText(imageBuffer);

        if (ocrResult.text.trim()) {
          finalContent = content
            ? `${content}\n\n[Распознанный текст из изображения]:\n${ocrResult.text}`
            : ocrResult.text;
        }
      } catch (error) {
        if (error instanceof OCRError) {
          console.error("[chat] OCR failed for all providers:", error.attempts);
        }
        // If OCR fails completely and no text content, we can't proceed
        if (!content.trim()) {
          finalContent = "[Ошибка распознавания изображения. Пожалуйста, введите текст задачи вручную.]";
        }
      }
    }

    const userMessage = await chatRepo.createMessage({
      chatId: sessionId,
      role: "user",
      content: finalContent,
      sourceType: imageBuffer ? "image" : sourceType,
    });

    // Build conversation context from history
    const history = await chatRepo.getMessagesByChatId(sessionId);
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Include recent history (excluding the just-created user message which is already in DB)
    for (const msg of history) {
      if (userMessage && msg.id === userMessage.id) continue;
      if (msg.role === "system") continue;
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({ role: "user", content: finalContent });

    // Generate AI response via OpenRouter
    let assistantContent: string;
    try {
      const aiService = getAIService();
      const result = await aiService.complete(messages);
      assistantContent = result.content;
    } catch (error) {
      console.error("[chat] AI generation failed:", error);
      assistantContent =
        "Произошла ошибка при генерации ответа. Пожалуйста, попробуйте ещё раз.";
    }

    const assistantMessage = await chatRepo.createMessage({
      chatId: sessionId,
      role: "assistant",
      content: assistantContent,
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
