import { chatRepo } from "./repo";
import { getAIService } from "../ai";
import type { ChatMessage } from "../ai";
import { createOCRService, OCRError } from "../ocr";
import type { OCRResult } from "../ocr";
import { templateRepo } from "../template/repo";
import {
  checkPromptSafety,
  checkResponseSafety,
  getBlockedMessage,
  getFilteredResponseMessage,
  logSafetyEvent,
  SAFETY_GUARDRAIL,
} from "../safety";

const DEFAULT_SYSTEM_PROMPT =
  "Ты — StudentHelper, помощник для школьников. " +
  "Отвечай на русском языке. Решай задачи пошагово. " +
  "Если задача получена из изображения через OCR, учти, что текст может содержать неточности распознавания. " +
  SAFETY_GUARDRAIL;

type TemplatePreset = {
  tone: string;
  knowledgeLevel: string;
  outputFormat: string;
  outputLanguage: string;
  responseLength: string;
  extraPreferences?: unknown;
};

export function buildSystemPrompt(
  mode: "fast" | "learning",
  template?: TemplatePreset | null,
): string {
  if (!template) return DEFAULT_SYSTEM_PROMPT;

  const parts: string[] = [
    "Ты — StudentHelper, помощник для школьников.",
  ];

  // Tone
  const toneMap: Record<string, string> = {
    friendly: "Используй дружелюбный и поддерживающий тон.",
    formal: "Используй формальный и академический тон.",
    casual: "Используй неформальный, разговорный тон.",
    encouraging: "Используй мотивирующий и ободряющий тон.",
  };
  parts.push(toneMap[template.tone] ?? `Тон общения: ${template.tone}.`);

  // Knowledge level
  const levelMap: Record<string, string> = {
    basic: "Объясняй простым языком, избегай сложных терминов.",
    intermediate: "Используй умеренную сложность объяснений.",
    advanced: "Можешь использовать продвинутую терминологию и сложные концепции.",
  };
  parts.push(levelMap[template.knowledgeLevel] ?? `Уровень знаний ученика: ${template.knowledgeLevel}.`);

  // Output format
  const formatMap: Record<string, string> = {
    full: "Давай полные развёрнутые ответы с пояснениями.",
    concise: "Давай краткие ответы по существу.",
    "step-by-step": "Давай пошаговые решения с нумерацией шагов.",
  };
  parts.push(formatMap[template.outputFormat] ?? `Формат ответа: ${template.outputFormat}.`);

  // Response length
  const lengthMap: Record<string, string> = {
    short: "Ответы должны быть короткими (1-3 предложения).",
    medium: "Ответы средней длины.",
    long: "Давай подробные, развёрнутые ответы.",
  };
  parts.push(lengthMap[template.responseLength] ?? `Длина ответа: ${template.responseLength}.`);

  // Language
  if (template.outputLanguage !== "ru") {
    parts.push(`Отвечай на языке: ${template.outputLanguage}.`);
  } else {
    parts.push("Отвечай на русском языке.");
  }

  // Mode-specific instructions
  if (mode === "fast") {
    parts.push("Режим: быстрый ответ. Дай решение задачи.");
  } else {
    parts.push("Режим: обучение. Помоги ученику понять, как решать задачу, а не просто дай ответ.");
  }

  parts.push(
    "Если задача получена из изображения через OCR, учти, что текст может содержать неточности распознавания.",
  );

  // Safety guardrail — always last, cannot be overridden by template
  parts.push(SAFETY_GUARDRAIL);

  return parts.join(" ");
}

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
    templateId?: string,
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

    // ── Safety check on user input ──
    const promptCheck = checkPromptSafety(finalContent);
    if (!promptCheck.safe) {
      console.warn(
        `[safety] Blocked unsafe prompt: reason=${promptCheck.reason}, severity=${promptCheck.severity}, userId=${userId}`,
      );

      // Save the user message (with original content for audit)
      const userMessage = await chatRepo.createMessage({
        chatId: sessionId,
        role: "user",
        content: finalContent,
        sourceType: imageBuffer ? "image" : sourceType,
      });

      // Return a safe response instead of calling AI
      const blockedMessage = getBlockedMessage(promptCheck.reason!);
      const assistantMessage = await chatRepo.createMessage({
        chatId: sessionId,
        role: "assistant",
        content: blockedMessage,
        sourceType: "text",
      });

      // Log safety event (fire-and-forget)
      logSafetyEvent({
        userId,
        sessionId,
        eventType: "blocked_prompt",
        severity: promptCheck.severity,
        details: JSON.stringify({
          reason: promptCheck.reason,
          contentPreview: finalContent.slice(0, 200),
        }),
      });

      return { userMessage, assistantMessage };
    }

    const userMessage = await chatRepo.createMessage({
      chatId: sessionId,
      role: "user",
      content: finalContent,
      sourceType: imageBuffer ? "image" : sourceType,
    });

    // Resolve template: explicit templateId > user's default > none (safe fallback)
    let template: TemplatePreset | null = null;
    try {
      if (templateId) {
        const preset = await templateRepo.getById(templateId);
        if (preset && preset.userId === userId) {
          template = preset;
        }
      } else {
        const defaultPreset = await templateRepo.getDefaultForUser(userId);
        if (defaultPreset) {
          template = defaultPreset;
        }
      }
    } catch (error) {
      console.error("[chat] Failed to resolve template, using default prompt:", error);
    }

    const systemPrompt = buildSystemPrompt(session.mode, template);

    // Build conversation context from history
    const history = await chatRepo.getMessagesByChatId(sessionId);
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
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

    // ── Safety check on AI response ──
    const responseCheck = checkResponseSafety(assistantContent);
    if (!responseCheck.safe) {
      console.warn(
        `[safety] Filtered unsafe AI response: reason=${responseCheck.reason}, severity=${responseCheck.severity}`,
      );

      logSafetyEvent({
        userId,
        sessionId,
        eventType: "unsafe_response_filtered",
        severity: responseCheck.severity,
        details: JSON.stringify({
          reason: responseCheck.reason,
          contentPreview: assistantContent.slice(0, 200),
        }),
      });

      assistantContent = getFilteredResponseMessage();
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
