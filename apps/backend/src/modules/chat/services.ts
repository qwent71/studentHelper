import { messageGenerationQueue } from "../../queues";
import * as repo from "./repo";

export const MAX_CONTEXT_MESSAGES = 20;

export class ChatNotFoundError extends Error {
  constructor(chatId: string) {
    super(`Chat ${chatId} not found`);
    this.name = "ChatNotFoundError";
  }
}

export function createChat(userId: string, title?: string) {
  return repo.createChat(userId, title ?? "New Chat");
}

export function listUserChats(userId: string) {
  return repo.listUserChats(userId);
}

export async function getChatMessages(chatId: string, userId: string) {
  const chat = await repo.getChatByIdForUser(chatId, userId);
  if (!chat) {
    throw new ChatNotFoundError(chatId);
  }
  return repo.getMessagesByChatId(chatId);
}

export async function sendMessage(
  chatId: string,
  userId: string,
  content: string,
) {
  const chat = await repo.getChatByIdForUser(chatId, userId);
  if (!chat) {
    throw new ChatNotFoundError(chatId);
  }

  const newMessage = await repo.createMessage(chatId, "user", content);

  await messageGenerationQueue.add("generate", {
    chatId,
    messageId: newMessage.id,
    userId,
  });

  await repo.updateChatTimestamp(chatId);

  return newMessage;
}
